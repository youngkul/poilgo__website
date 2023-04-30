// models/user.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const workoutHistorySchema = new mongoose.Schema({
    exercise: String,
    weight: Number,
    date: Date
  });
  const userSchema = new Schema({
    name: String, // 사용자 이름을 저장하는 속성을 추가하세요.
    email: String,
    password: String,
    workoutHistory: [
        {
            exercise: String,
            weight: Number,
            date: Date,
        },
    ],
});


module.exports = mongoose.model('User', userSchema);
