let questions = [];
let mbtiResults = {};
let currentQuestionIndex = 0;
let scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
let displayedMbtiType = ''; // To store the type shown on the result page

async function loadQuizData() {
    try {
        const response = await fetch('data/questions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        questions = await response.json();
    } catch (error) {
        console.error("質問データの読み込みに失敗しました:", error); // Translated
        const questionTextElement = document.getElementById('questionText');
        if (questionTextElement) {
            questionTextElement.textContent = "質問を読み込めませんでした。ページを再読み込みするか、後でもう一度お試しください。"; // Translated
        }
        questions = []; // Ensure questions is empty on failure
        const progressBarElement = document.getElementById('progressBar');
        if (progressBarElement) {
            progressBarElement.style.width = '0%';
        }
    }
}

async function loadResultsPageData() {
    try {
        const response = await fetch('data/results.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        mbtiResults = await response.json();
    } catch (error) {
        console.error("結果データの読み込みに失敗しました:", error); // Translated
        mbtiResults = {}; // Ensure results is empty on failure
    }
}

function displayQuestion() {
    const quizAreaElement = document.getElementById('quizArea');
    const progressBarElement = document.getElementById('progressBar');

    if (quizAreaElement) {
        quizAreaElement.classList.remove('visible');
    }

    requestAnimationFrame(() => {
        const questionTextElement = document.getElementById('questionText');
        const answerOptionsElement = document.getElementById('answerOptions');

        if (questions.length === 0 || currentQuestionIndex >= questions.length) {
            if (questionTextElement) {
                if (questions.length === 0) {
                    if (questionTextElement.textContent && !questionTextElement.textContent.includes("読み込めませんでした")) {
                         questionTextElement.textContent = "質問データを読み込めませんでした。ページを再読み込みしてください。";
                    }
                } else {
                    questionTextElement.textContent = "これ以上質問はありません。";
                }
            }
            if (answerOptionsElement) answerOptionsElement.innerHTML = '';
            if (progressBarElement) {
                progressBarElement.style.width = (questions.length > 0 && currentQuestionIndex >= questions.length) ? '100%' : '0%';
            }

            if (questions.length > 0 && currentQuestionIndex >= questions.length) {
                showResults();
            } else if (quizAreaElement) {
                void quizAreaElement.offsetWidth;
                quizAreaElement.classList.add('visible');
            }
            return;
        }

        if (progressBarElement) {
            const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
            progressBarElement.style.width = progressPercentage + '%';
        }

        const question = questions[currentQuestionIndex];
        const questionImageElement = document.getElementById('questionImage');

        if (!questionTextElement || !answerOptionsElement) {
            console.error("クイズ要素（questionTextまたはanswerOptions）が見つかりません。");
            if (quizAreaElement) {
                void quizAreaElement.offsetWidth;
                quizAreaElement.classList.add('visible');
            }
            return;
        }

        questionTextElement.textContent = question.text;
        if (question.image && questionImageElement) {
            questionImageElement.src = question.image;
            questionImageElement.style.display = 'block';
        } else if (questionImageElement) {
            questionImageElement.style.display = 'none';
            questionImageElement.src = "";
        }

        answerOptionsElement.innerHTML = '';
        question.answers.forEach(answer => {
            const button = document.createElement('button');
            button.textContent = answer.text;
            button.addEventListener('click', () => selectAnswer(answer.scores));
            answerOptionsElement.appendChild(button);
        });

        if (quizAreaElement) {
            void quizAreaElement.offsetWidth;
            quizAreaElement.classList.add('visible');
        }
    });
}

function selectAnswer(answerScores) {
    for (const type in answerScores) {
        if (scores.hasOwnProperty(type)) {
            scores[type] += answerScores[type];
        }
    }
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        displayQuestion();
    } else {
        const progressBarElement = document.getElementById('progressBar');
        if (progressBarElement) {
            progressBarElement.style.width = '100%';
        }
        showResults();
    }
}

function showResults() {
    localStorage.setItem('mbtiScores', JSON.stringify(scores));
    window.location.href = 'result.html';
}

function calculateMbtiType(finalScores) {
    let mbtiType = "";
    mbtiType += finalScores.E >= finalScores.I ? 'E' : 'I';
    mbtiType += finalScores.S >= finalScores.N ? 'S' : 'N';
    mbtiType += finalScores.T >= finalScores.F ? 'T' : 'F';
    mbtiType += finalScores.J >= finalScores.P ? 'J' : 'P';
    return mbtiType;
}

function displayResult() {
    const resultAreaElement = document.getElementById('resultArea');
    if (resultAreaElement) {
        resultAreaElement.classList.remove('visible');
    }

    requestAnimationFrame(() => {
        const mbtiTypeCodeElement = document.getElementById('mbtiTypeCode');
        const loveKeywordsElement = document.getElementById('loveKeywords');
        const basicStanceElement = document.getElementById('basicStance');
        const appealPointsElement = document.getElementById('appealPoints');
        const challengesElement = document.getElementById('challengesElement');
        const compatibilityElement = document.getElementById('compatibilityElement');
        const communicationElement = document.getElementById('communicationElement');
        const shareButton = document.getElementById('shareButton');

        const elementsToQuery = {
            mbtiTypeCodeElement, loveKeywordsElement, basicStanceElement,
            appealPointsElement, challengesElement, compatibilityElement,
            communicationElement, resultAreaElement
        };

        let allEssentialElementsPresent = true;
        for (const key in elementsToQuery) {
            if (!elementsToQuery[key] && key !== 'shareButton') {
                allEssentialElementsPresent = false;
                console.error(`必要なHTML要素が見つかりません: ${key}`);
                break;
            }
        }

        function clearResultFields(errorMessage = "") {
            for (const key in elementsToQuery) {
                if (elementsToQuery[key] && key !== 'resultAreaElement' && key !== 'shareButton') {
                    elementsToQuery[key].innerHTML = "";
                }
            }
            if (mbtiTypeCodeElement && errorMessage) mbtiTypeCodeElement.textContent = errorMessage;
        }

        if (!allEssentialElementsPresent) {
            clearResultFields("結果表示エラー。");
            const bodyElement = document.body;
            if (bodyElement && resultAreaElement && !bodyElement.textContent.includes("ページ要素がありません")) {
                const errorDiv = document.createElement('div');
                errorDiv.textContent = "結果表示に必要なページ要素がありません。管理者に連絡してください。";
                resultAreaElement.prepend(errorDiv);
            }
            if (resultAreaElement) {
                void resultAreaElement.offsetWidth;
                resultAreaElement.classList.add('visible');
            }
            return;
        }

        if (Object.keys(mbtiResults).length === 0) {
            clearResultFields("結果データを読み込めませんでした。");
            if(communicationElement) communicationElement.innerHTML = "ページを再読み込みするか、後でもう一度お試しください。";
            if (shareButton) shareButton.style.display = 'none';
            if (resultAreaElement) {
                void resultAreaElement.offsetWidth;
                resultAreaElement.classList.add('visible');
            }
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const typeFromUrl = urlParams.get('type');
        let finalMbtiType = "";

        if (typeFromUrl && mbtiResults[typeFromUrl.toUpperCase()]) {
            finalMbtiType = typeFromUrl.toUpperCase();
        } else {
            const scoresString = localStorage.getItem('mbtiScores');
            if (scoresString) {
                const finalScores = JSON.parse(scoresString);
                finalMbtiType = calculateMbtiType(finalScores);
                const newUrl = `${window.location.pathname}?type=${finalMbtiType}`;
                history.replaceState({ type: finalMbtiType }, '', newUrl);
            } else {
                clearResultFields("まずテストを実施してください！");
                if(basicStanceElement) basicStanceElement.innerHTML = "スタートページに戻ってテストを完了してください。";
                if (shareButton) shareButton.style.display = 'none';
                if (resultAreaElement) {
                    void resultAreaElement.offsetWidth;
                    resultAreaElement.classList.add('visible');
                }
                return;
            }
        }

        displayedMbtiType = finalMbtiType;
        const resultData = mbtiResults[displayedMbtiType];

        if (resultData) {
            if(mbtiTypeCodeElement) mbtiTypeCodeElement.textContent = resultData.type_code;
            if(loveKeywordsElement) loveKeywordsElement.textContent = resultData.love_keywords;

            const fieldsToSetInnerHtml = {
                basicStance: resultData.basic_stance,
                appealPoints: resultData.appeal_points,
                challengesElement: resultData.challenges,
                compatibilityElement: resultData.compatibility,
                communicationElement: resultData.communication
            };

            for (const key in fieldsToSetInnerHtml) {
                const element = document.getElementById(key);
                if (element && fieldsToSetInnerHtml[key]) {
                    element.innerHTML = fieldsToSetInnerHtml[key].replace(/\n/g, '<br>');
                } else if (element) {
                    element.innerHTML = "";
                }
            }

            if (shareButton) shareButton.style.display = 'inline-block';
        } else {
            clearResultFields(`結果が見つかりません: ${displayedMbtiType}`);
            if(communicationElement) communicationElement.innerHTML = "このMBTIタイプに関する情報が現在のデータにありません。";
            if (shareButton) shareButton.style.display = 'none';
        }

        if (resultAreaElement) {
            void resultAreaElement.offsetWidth;
            resultAreaElement.classList.add('visible');
        }
    });
}

function copyToClipboard(text, feedbackMessage = 'クリップボードにコピーされました！') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert(feedbackMessage);
        }).catch(err => {
            console.error('navigator.clipboardでのコピーに失敗しました: ', err);
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed"; textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus(); textArea.select();
            try {
                const successful = document.execCommand('copy');
                alert(successful ? feedbackMessage : 'クリップボードのコピーに失敗しました。');
            } catch (errInner) {
                alert('クリップボードのコピーに失敗しました。');
                console.error('フォールバックコピーに失敗しました: ', errInner);
            }
            document.body.removeChild(textArea);
        });
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed"; textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus(); textArea.select();
        try {
            const successful = document.execCommand('copy');
            alert(successful ? feedbackMessage : 'クリップボードのコピーに失敗しました。手動でコピーしてください。');
        } catch (err) {
            alert('クリップボードのコピーに失敗しました。手動でコピーしてください。');
            console.error('レガシーフォールバックコピーに失敗しました: ', err);
        }
        document.body.removeChild(textArea);
    }
}

async function shareResult() {
    if (!displayedMbtiType || !mbtiResults[displayedMbtiType]) {
        alert("表示する結果がないか、結果データがまだ読み込まれていません。しばらくしてからもう一度お試しください。");
        return;
    }

    const resultData = mbtiResults[displayedMbtiType];
    const firstKeyword = resultData.love_keywords ? (resultData.love_keywords.split(' ')[0] || displayedMbtiType) : displayedMbtiType;
    const shareUrl = `${window.location.origin}${window.location.pathname}?type=${displayedMbtiType}`;
    const shareText = `💖 私の恋愛スタイル診断結果は【${displayedMbtiType} (${firstKeyword})】でした！
あなたも診断してみよう！👇
${shareUrl}`;
    const shareTitle = 'ドキドキ！私の恋愛スタイルMBTI診断';

    if (navigator.share) {
        try {
            await navigator.share({
                title: shareTitle,
                text: shareText,
            });
            console.log('Web Share API経由で結果が正常に共有されました');
        } catch (error) {
            console.error('Web Share API経由での共有エラー:', error);
            if (error.name !== 'AbortError') {
                copyToClipboard(shareText, "共有に失敗しました。\n診断結果のテキストがクリップボードにコピーされました。");
            }
        }
    } else {
        copyToClipboard(shareText, "共有機能がサポートされていない環境です。\n診断結果のテキストがクリップボードにコピーされました。");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const quizArea = document.getElementById('quizArea');
    const resultArea = document.getElementById('resultArea');
    const restartButton = document.getElementById('restartButton');
    const shareButton = document.getElementById('shareButton');

    if (startButton) {
        startButton.addEventListener('click', () => window.location.href = 'quiz.html');
    }

    if (quizArea) {
        currentQuestionIndex = 0;
        scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
        const progressBarElement = document.getElementById('progressBar');
        if (progressBarElement) progressBarElement.style.width = '0%';

        loadQuizData().then(() => {
            displayQuestion();
        }).catch(error => {
            console.error("クイズの初回読み込み中に予期せぬエラーが発生しました:", error);
            const questionTextElement = document.getElementById('questionText');
            if (questionTextElement) {
                 questionTextElement.textContent = "クイズの読み込み中にエラーが発生しました。ページを再読み込みしてください。";
            }
        });
    }

    if (resultArea) {
        loadResultsPageData().then(() => {
            displayResult();
            if (shareButton) {
                shareButton.addEventListener('click', shareResult);
            }
        }).catch(error => {
            console.error("結果の初回読み込み中に予期せぬエラーが発生しました:", error);
            const mbtiTypeCodeElement = document.getElementById('mbtiTypeCode');
            if (mbtiTypeCodeElement) {
                mbtiTypeCodeElement.textContent = "結果の読み込み中にエラーが発生しました。";
            }
             const communicationElement = document.getElementById('communicationElement');
            if(communicationElement) {
                 communicationElement.innerHTML = "ページを再読み込みしてください。";
            }
        });
    }

    if (restartButton) {
        restartButton.addEventListener('click', () => {
            localStorage.removeItem('mbtiScores');
            window.location.href = 'index.html';
        });
    }
});
