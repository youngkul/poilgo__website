const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const User = require('./models/user');
const fs = require('fs');
const path = require('path');

app.get('/api/images', (req, res) => {
    const imageDir = path.join(__dirname, 'public', 'uploads');
    fs.readdir(imageDir, (err, files) => {
        if (err) {
            res.status(500).send('서버에서 이미지를 불러올 수 없습니다.');
            return;
        }
        res.json(files);
    });
});

mongoose.connect('mongodb://localhost/y2k4872', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB에 연결되었습니다.'))
    .catch((err) => console.error('MongoDB 연결에 실패했습니다.', err));

app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; font-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; img-src 'self'; script-src 'self' 'unsafe-inline';"
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
    res.redirect('/');
});

app.use(express.static('public'));

app.post('/signup', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).send('이미 사용 중인 이메일입니다.');
        } else {
            const newUser = new User({ name, email, password });
            await newUser.save();
            res.redirect('/login.html');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('서버에서 오류가 발생했습니다.');
    }
});

app.get('/login.html', (req, res) => {
    res.sendFile(__dirname + '/views/login.html');
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (user) {
      res.cookie('userId', user._id);
      res.redirect('/');
    } else {
      res.redirect('/login.html');
    }
  });
  



app.listen(port, () => {
    console.log(`서버가 ${port} 포트에서 실행 중입니다.`);
});

app.get('/upload-media', (req, res) => {
    res.sendFile(__dirname + '/public/upload-media.html');
});


app.get('/record-data', (req, res) => {
    res.sendFile(__dirname + '/public/record-data.html');
});

app.post('/api/records', async (req, res) => {
    const { userId, exercise, weight, date } = req.body;
    try {
        const user = await User.findOne({ email: userId });
        if (user) {
            user.workoutHistory.push({ exercise, weight, date });
            await user.save();
            res.sendStatus(200);
        } else {
            res.status(500).send('사용자를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('서버에서 오류가 발생했습니다.');
    }
});
app.get('/api/records/:userId', async (req, res) => {
    const userId = req.params.userId;
    console.log('userId:', userId);
    try {
        const user = await User.findById(userId);
        console.log('userId:', userId);
        if (user) {
            res.json(user.workoutHistory);
        } else {
            res.status(404).send('사용자를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('서버에서 오류가 발생했습니다.');
    }
});




app.get('/api/records', async (req, res) => {
    let recordsWithUserName = [];
    try {
        const users = await User.find().sort({ name: 1 });

        for (const user of users) {
            for (const record of user.workoutHistory) {
                recordsWithUserName.push({
                    id: record._id, // _id를 id로 변경
                    userName: user.name || '이름 없음',
                    exercise: record.exercise,
                    weight: record.weight,
                    date: record.date,
                });
            }
        }

        res.json(recordsWithUserName);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('서버에서 오류가 발생했습니다.');
    }
});



app.get('/data_list.html', (req, res) => {
    res.sendFile(__dirname + '/public/data_list.html');
});
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });
  app.delete('/api/records/:id', async (req, res) => {
    const recordId = req.params.id;

    try {
        const users = await User.find();
        let found = false;

        for (const user of users) {
            const record = user.workoutHistory.id(recordId);
            if (record) {
                user.workoutHistory.pull({ _id: recordId });
                await user.save();
                res.sendStatus(200);
                found = true;
                break;
            }
        }

        if (!found) {
            res.status(500).send('기록을 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('서버에서 오류가 발생했습니다.');
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('userId');
    res.redirect('/login.html');
});
app.put('/api/records/:id', async (req, res) => {
    const recordId = req.params.id;
    const { date, weight } = req.body;
  
    try {
      const user = await User.findOne({ "workoutHistory._id": recordId });
      if (user) {
        const record = user.workoutHistory.id(recordId);
        if (record) {
          record.date = date;
          record.weight = weight;
          await user.save();
          res.sendStatus(200);
        } else {
          res.status(404).send('기록을 찾을 수 없습니다.');
        }
      } else {
        res.status(404).send('사용자를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('서버에서 오류가 발생했습니다.');
    }
  });
  app.get('/weight-record', (req, res) => {
    res.sendFile(__dirname + '/public/weight-record.html');
});
app.post('/api/weights', async (req, res) => {
    const { userId, date, weight } = req.body;
    
    try {
        const user = await User.findOne({ email: userId });
        if (user) {
            user.weightHistory.push({ date, weight });
            await user.save();
            res.sendStatus(200);
        } else {
            res.status(500).send('사용자를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('서버에서 오류가 발생했습니다.');
    }
});

app.get('/api/weights/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const user = await User.findById(userId);
        if (user) {
            res.json(user.weightHistory);
        } else {
            res.status(404).send('사용자를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('서버에서 오류가 발생했습니다.');
    }
});
