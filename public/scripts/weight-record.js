document.getElementById('weight-submit').addEventListener('click', async () => {
    const date = document.getElementById('date').value;
    const weight = document.getElementById('weight').value;

    const response = await fetch('/api/weights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ date, weight })
    });

    if (response.ok) {
      alert('체중이 성공적으로 기록되었습니다.');
    } else {
      alert('체중 기록에 실패했습니다.');
    }
});

async function getWeights() {
    const response = await fetch('/api/weights');
    const weights = await response.json();
    // weights를 사용하여 페이지에 표시하는 코드 작성
}

getWeights();

async function displayWeights() {
    const userId = '6449ce4868bf771fc2b9fd02'; // 사용자 ID를 적절한 값으로 변경해 주세요.
    const response = await fetch(`/api/weights/${userId}`);
    const weights = await response.json();

    const weightRecords = document.getElementById('weight-records');
    weightRecords.innerHTML = '';

    weights.forEach((weight) => {
        const record = document.createElement('div');
        record.innerHTML = `
            <p>날짜: ${weight.date}</p>
            <p>체중: ${weight.weight}kg</p>
            <hr>
        `;
        weightRecords.appendChild(record);
    });
}

displayWeights();
