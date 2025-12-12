// ======================================================
// === PENGATURAN INTEGRASI GOOGLE SHEETS (HARAP GANTI!) ===
// ======================================================
const GOOGLE_FORM_ACTION_URL = 'YOUR_ACTION_URL_DARI_GOOGLE_FORM';
const FIELD_ID_NAMA = 'entry.135792468';      // Contoh ID untuk Nama Kandidat
const FIELD_ID_ROLE = 'entry.246801357';      // Contoh ID untuk Posisi/Kelas
const FIELD_ID_SCORE = 'entry.123456789';      
const FIELD_ID_ACCURACY = 'entry.987654321';   
const FIELD_ID_STATUS = 'entry.112233445';      
// ======================================================

// Database Soal (Gunakan data dari contoh sebelumnya, diulang untuk panjang)
const quizData = [
    // ... (Minim 25 data soal di sini) ...
    {
        question: "Manakah penulisan kata serapan yang baku dan benar menurut PUEBI?",
        options: ["A. atlit", "B. aktifitas", "C. apotik", "D. atlet"],
        answer: "D. atlet"
    },
    {
        question: "Pilihlah kalimat yang paling efektif dan tidak ambigu untuk sebuah memo.",
        options: [
            "A. Walaupun sudah malam, namun dia masih tetap bekerja.",
            "B. Walaupun sudah malam, dia masih tetap bekerja.",
            "C. Meskipun sudah malam, dia masih tetap bekerja.",
            "D. Meskipun sudah malam, namun dia masih tetap bekerja."
        ],
        answer: "B. Walaupun sudah malam, dia masih tetap bekerja."
    },
    {
        question: "Padanan kata Bahasa Indonesia yang tepat untuk istilah 'Brainstorming' adalah...",
        options: ["A. Curah Pendapat", "B. Diskusi Cepat", "C. Ide Kreatif", "D. Bertukar Pikiran"],
        answer: "A. Curah Pendapat"
    },
    {
        question: "Mengubah kata kerja 'rubah' menjadi bentuk baku yang benar adalah...",
        options: ["A. Merubah", "B. Mengrubah", "C. Mengubah", "D. Perubahan"],
        answer: "C. Mengubah"
    }
];

// Variabel Global
let currentQuestionIndex = 0;
let score = 0;
let correctCount = 0;
const TIME_LIMIT = 20; 
let timerInterval;

// Data Kandidat
let candidateName = '';
let candidateRole = '';

// Referensi Elemen HTML
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const startForm = document.getElementById('start-form');
const quizContainer = document.getElementById('quiz-container');
const questionArea = document.getElementById('question-area');
const optionsContainer = document.getElementById('options-container');
const timerDisplay = document.getElementById('timer-display');
const scoreDisplay = document.getElementById('score-display');
const feedback = document.getElementById('feedback');


// --- LOGIKA UTAMA GAME ---

// 1. Logika Input Data Diri
startForm.addEventListener('submit', function(e) {
    e.preventDefault();
    candidateName = document.getElementById('candidate-name').value.trim();
    candidateRole = document.getElementById('candidate-role').value.trim();
    
    if (candidateName && candidateRole) {
        startScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        displayQuestion();
    } else {
        alert("Mohon lengkapi Nama dan Posisi/Kelas.");
    }
});


// 2. Logika Game (Display, Timer, Check Answer) - Sama seperti sebelumnya

function updateScore(points) {
    score += points;
    scoreDisplay.textContent = score;
}

function startTimer() {
    // ... (Logika Timer tetap sama) ...
    let timeLeft = TIME_LIMIT;
    timerDisplay.textContent = `Waktu: ${timeLeft}s`;

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `Waktu: ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            feedback.textContent = "Waktu Habis! Poin dikurangi -2.";
            updateScore(-2);
            setTimeout(nextQuestion, 1500);
        }
    }, 1000);
}

function displayQuestion() {
    if (currentQuestionIndex >= quizData.length) {
        endGame();
        return;
    }

    const q = quizData[currentQuestionIndex];
    questionArea.textContent = `${currentQuestionIndex + 1}/${quizData.length}. ${q.question}`;
    optionsContainer.innerHTML = '';
    feedback.textContent = '';
    
    q.options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option;
        button.onclick = () => checkAnswer(option, button);
        optionsContainer.appendChild(button);
    });

    clearInterval(timerInterval);
    startTimer();
}

function checkAnswer(selectedAnswer, button) {
    clearInterval(timerInterval);
    const q = quizData[currentQuestionIndex];

    const isCorrect = selectedAnswer === q.answer;
    const points = isCorrect ? 5 : -3;

    if (isCorrect) {
        correctCount++;
    }

    // Visual feedback
    optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true; 
        if (btn.textContent === q.answer) {
            btn.classList.add('correct');
        } else if (btn === button && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });

    feedback.textContent = isCorrect 
        ? `BENAR! +${points} Poin.` 
        : `SALAH! Jawaban yang benar adalah: ${q.answer}. ${points} Poin.`;
    
    updateScore(points);
    
    setTimeout(nextQuestion, 2000); 
}

function nextQuestion() {
    currentQuestionIndex++;
    displayQuestion();
}


// --- LOGIKA PENGIRIMAN DATA ---

function sendResultToGoogleSheets(finalScore, finalAccuracy, finalStatus) {
    const data = {};
    data[FIELD_ID_NAMA] = candidateName;
    data[FIELD_ID_ROLE] = candidateRole;
    data[FIELD_ID_SCORE] = finalScore;
    data[FIELD_ID_ACCURACY] = finalAccuracy + '%'; 
    data[FIELD_ID_STATUS] = finalStatus;

    const formData = new URLSearchParams(data).toString();

    fetch(GOOGLE_FORM_ACTION_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
    })
    .then(() => {
        console.log(`Data ${candidateName} berhasil dikirim.`);
    })
    .catch(error => {
        console.error("Gagal mengirim data:", error);
    });
}

function endGame() {
    const totalQuestions = quizData.length;
    const finalAccuracy = ((correctCount / totalQuestions) * 100).toFixed(0); 
    
    let status = 'PERLU PERBAIKAN';
    if (finalAccuracy >= 75) {
        status = 'LULUS';
    } else if (finalAccuracy >= 50) {
        status = 'CUKUP';
    }

    // KIRIM DATA KE SPREADSHEET
    sendResultToGoogleSheets(score, finalAccuracy, status); 

    // Tampilan Hasil Akhir di Layar
    quizContainer.innerHTML = `
        <div class="result-box">
            <h2>🎉 TES SELESAI, ${candidateName}!</h2>
            <p>Posisi: ${candidateRole}</p>
            <hr>
            <h3>🏆 HASIL KINERJA ANDA 🏆</h3>
            <p><strong>Skor Total:</strong> ${score} Poin</p>
            <p><strong>Akurasi Jawaban Benar:</strong> ${finalAccuracy}% (${correctCount} dari ${totalQuestions} soal)</p>
            <p><strong>Status Tes:</strong> <span class="${status.toLowerCase().replace(' ', '-')}">${status}</span></p>
            <p class="note">Data Anda telah direkam otomatis oleh sistem. Mohon tunggu informasi selanjutnya dari HRD.</p>
        </div>
    `;
}

// Tidak perlu panggil displayQuestion() di awal, karena akan dipanggil setelah form di-submit.
