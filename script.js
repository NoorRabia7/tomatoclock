const API_KEY = "sk-bmbubpzosfskzyhpfvmjnietpougrvxhvebyowxxhpdzeqvx";
const API_URL = "https://api.siliconflow.cn/v1/chat/completions";

const avatar = document.getElementById("avatar");
const startBtn = document.getElementById("start-btn");
const timerText = document.getElementById("timer-text");
const thinking = document.getElementById("thinking");
const progressCircle = document.querySelector(".progress-ring__circle");
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const personalityInput = document.getElementById("personality");
const saveBtn = document.getElementById("save-btn");
const closeBtn = document.getElementById("close-btn");
const taskInput = document.getElementById("task-name");
const stats = document.getElementById("stats");

const historyBtn = document.getElementById("history-btn");
const historyPanel = document.getElementById("history-panel");
const historyList = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history");
const closeHistoryBtn = document.getElementById("close-history");

const bgSelect = document.getElementById("bg-select");
const bgUpload = document.getElementById("bg-upload");
const containerBgColor = document.getElementById("container-bg-color");
const containerOpacityInput = document.getElementById("container-opacity");
const opacityValue = document.getElementById("opacity-value");
const themeColorInput = document.getElementById("theme-color");

const changeAvatarBtn = document.getElementById("change-avatar-btn");
const avatarUpload = document.getElementById("avatar-upload");
const avatarPreview = document.querySelector("#avatar-preview img");
const mainAvatar = document.getElementById("avatar");

const cropperModal = document.getElementById("cropper-modal");
const cropperImage = document.getElementById("cropper-image");
const zoomSlider = document.getElementById("zoom-slider");
const cropCancel = document.getElementById("crop-cancel");
const cropConfirm = document.getElementById("crop-confirm");

// ====== 状态变量 ======
let personality = localStorage.getItem("tomatoPersonality") || "你是一个可爱的西红柿学习搭子，陪我专注 25 分钟，说话温柔又有趣。";
let currentTask = localStorage.getItem("currentTask") || "";
let completedTomatoes = parseInt(localStorage.getItem("completedTomatoes") || "0", 10);
let sessionCount = parseInt(localStorage.getItem("sessionCount") || "0", 10);
let history = JSON.parse(localStorage.getItem("tomatoHistory") || "[]");

let bgStyle = localStorage.getItem("bgStyle") || "gradient1";
let bgImage = localStorage.getItem("bgImage") || "";
let containerColor = localStorage.getItem("containerColor") || "#ffffff";
let containerOpacity = localStorage.getItem("containerOpacity") || "100";
let themeColor = localStorage.getItem("themeColor") || "#ff6b6b";

let timer = null;
let timeLeft = 25 * 60;
let totalTime = 25 * 60;
let isRunning = false;
let isWorkSession = true;

const CIRCUMFERENCE = 527;

// ====== 初始化任务输入 ======
taskInput.value = currentTask;
taskInput.addEventListener("change", () => {
  currentTask = taskInput.value.trim();
  localStorage.setItem("currentTask", currentTask);
});

// ====== 应用外观设置 ======
function applyAppearance() {
  const body = document.body;
  const container = document.querySelector(".container");

  if (bgStyle === "custom" && bgImage) {
    body.style.background = `url(${bgImage}) center/cover no-repeat`;
  } else {
    const gradients = {
      gradient1: "linear-gradient(to bottom, #a1c4fd, #c2e9fb)",
      gradient2: "linear-gradient(to bottom, #cdb4db, #ffc8dd)",
      gradient3: "linear-gradient(to bottom, #a7f3d0, #d9f7be)"
    };
    body.style.background = gradients[bgStyle] || gradients.gradient1;
  }

  container.style.backgroundColor = containerColor;
  container.style.opacity = containerOpacity / 100;

  document.documentElement.style.setProperty('--theme-color', themeColor);
  const elements = [timerText, thinking, stats, taskInput];
  elements.forEach(el => {
    if (el.tagName === "INPUT") {
      el.style.borderColor = themeColor;
      el.style.color = themeColor;
    } else {
      el.style.color = themeColor;
    }
  });

  // 关键修复：按钮背景用主题色，文字强制白色
  startBtn.style.backgroundColor = themeColor;
  startBtn.style.color = "#fff";  // 强制白色文字
  progressCircle.style.stroke = themeColor;
}

applyAppearance();

// ====== 设置面板 ======
settingsBtn.addEventListener("click", () => {
  personalityInput.value = personality;
  bgSelect.value = bgStyle;
  containerBgColor.value = containerColor;
  containerOpacityInput.value = containerOpacity;
  opacityValue.textContent = containerOpacity + "%";
  themeColorInput.value = themeColor;

  const previewImg = document.querySelector("#avatar-preview img");
  previewImg.src = mainAvatar.src;

  settingsPanel.style.display = "block";
  historyPanel.style.display = "none";
});

saveBtn.addEventListener("click", () => {
  personality = personalityInput.value.trim() || "你是一个可爱的西红柿学习搭子。";
  localStorage.setItem("tomatoPersonality", personality);

  bgStyle = bgSelect.value;
  containerColor = containerBgColor.value;
  containerOpacity = containerOpacityInput.value;
  themeColor = themeColorInput.value;

  localStorage.setItem("bgStyle", bgStyle);
  if (bgStyle === "custom") localStorage.setItem("bgImage", bgImage);
  localStorage.setItem("containerColor", containerColor);
  localStorage.setItem("containerOpacity", containerOpacity);
  localStorage.setItem("themeColor", themeColor);

  applyAppearance();
  settingsPanel.style.display = "none";
  speak("设置已保存！", false);
});

closeBtn.addEventListener("click", () => {
  settingsPanel.style.display = "none";
});

bgSelect.addEventListener("change", () => {
  if (bgSelect.value === "custom") bgUpload.click();
});
bgUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      bgImage = ev.target.result;
      bgStyle = "custom";
      bgSelect.value = "custom";
      applyAppearance();
    };
    reader.readAsDataURL(file);
  }
});

containerOpacityInput.addEventListener("input", () => {
  const opacity = containerOpacityInput.value / 100;
  opacityValue.textContent = containerOpacityInput.value + "%";
  document.querySelector(".container").style.opacity = opacity;
});

// ====== 头像裁剪系统 ======
// 裁剪状态
let scale = 1;
let posX = 0, posY = 0;
let isDragging = false;
let startX, startY;

// 初始化头像
const savedAvatar = localStorage.getItem("customAvatar");
if (savedAvatar) {
  mainAvatar.src = savedAvatar;
  avatarPreview.src = savedAvatar;
}

changeAvatarBtn.addEventListener("click", () => {
  avatarUpload.click();
});

avatarUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    cropperImage.src = ev.target.result;
    cropperModal.style.display = "flex";
    cropperImage.onload = () => {
      resetCropper();
    };
  };
  reader.readAsDataURL(file);
});

// 重置裁剪器：强制填满 + 严格居中
function resetCropper() {
  const img = cropperImage;
  const containerSize = 240;

  if (!img.naturalWidth || !img.naturalHeight) {
    scale = 1; posX = 0; posY = 0; zoomSlider.value = 1;
    updateTransform();
    return;
  }

  const scaleToFill = Math.max(
    containerSize / img.naturalWidth,
    containerSize / img.naturalHeight
  );

  scale = scaleToFill * 1.1;
  zoomSlider.value = scale;

  const scaledW = img.naturalWidth * scale;
  const scaledH = img.naturalHeight * scale;
  posX = (containerSize - scaledW) / 2;
  posY = (containerSize - scaledH) / 2;

  updateTransform();
}

// 更新变换 + 强制边界限制
function updateTransform() {
  const img = cropperImage;
  if (!img.naturalWidth) {
    img.style.transform = `translate(0px, 0px) scale(1)`;
    return;
  }

  const scaledW = img.naturalWidth * scale;
  const scaledH = img.naturalHeight * scale;
  const maxX = Math.max(0, (scaledW - 240) / 2);
  const maxY = Math.max(0, (scaledH - 240) / 2);

  posX = Math.max(-maxX, Math.min(maxX, posX));
  posY = Math.max(-maxY, Math.min(maxY, posY));

  img.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
}

zoomSlider.addEventListener("input", () => {
  scale = parseFloat(zoomSlider.value);
  updateTransform();
});

cropperImage.addEventListener("mousedown", startDrag);
cropperImage.addEventListener("touchstart", (e) => {
  e.preventDefault();
  startDrag(e.touches[0]);
}, { passive: false });

function startDrag(e) {
  isDragging = true;
  startX = e.clientX - posX;
  startY = e.clientY - posY;
}

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  posX = e.clientX - startX;
  posY = e.clientY - startY;
  updateTransform();
});

document.addEventListener("touchmove", (e) => {
  if (!isDragging) return;
  const touch = e.touches[0];
  posX = touch.clientX - startX;
  posY = touch.clientY - startY;
  updateTransform();
}, { passive: false });

document.addEventListener("mouseup", endDrag);
document.addEventListener("touchend", endDrag);

function endDrag() {
  isDragging = false;
}

cropCancel.addEventListener("click", () => {
  cropperModal.style.display = "none";
});

cropConfirm.addEventListener("click", () => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const outputSize = 140;

  canvas.width = outputSize;
  canvas.height = outputSize;

  const img = cropperImage;
  if (!img.complete || img.naturalWidth === 0) {
    alert("图片加载中，请稍候");
    return;
  }

  const cropCenterX = 120;
  const cropCenterY = 120;
  const currentScale = scale;
  const translateX = posX;
  const translateY = posY;

  const offsetX = cropCenterX - translateX;
  const offsetY = cropCenterY - translateY;

  const imgScaleInContainer = img.naturalWidth / 240;

  const sourceX = (offsetX / currentScale) * imgScaleInContainer;
  const sourceY = (offsetY / currentScale) * imgScaleInContainer;
  const sourceSize = (outputSize / currentScale) * imgScaleInContainer;

  const safeX = Math.max(0, Math.min(sourceX, img.naturalWidth - sourceSize));
  const safeY = Math.max(0, Math.min(sourceY, img.naturalHeight - sourceSize));
  const safeSize = Math.min(sourceSize, img.naturalWidth - safeX, img.naturalHeight - safeY);

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, outputSize, outputSize);

  ctx.save();
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, safeX, safeY, safeSize, safeSize, 0, 0, outputSize, outputSize);
  ctx.restore();

  const croppedDataUrl = canvas.toDataURL("image/png");

  mainAvatar.src = croppedDataUrl;
  document.querySelector("#avatar-preview img").src = croppedDataUrl;
  localStorage.setItem("customAvatar", croppedDataUrl);

  cropperModal.style.display = "none";
  speak("头像换好啦！完美居中～", false);
});

// ====== 历史记录 ======
function renderHistory() {
  if (history.length === 0) {
    historyList.innerHTML = "<p style='color:#ccc;text-align:center;'>暂无记录</p>";
    return;
  }
  historyList.innerHTML = history.map(item => `
    <div class="history-item">
      <strong>${item.task || "无任务"}</strong> - 
      <span style="color:var(--theme-color)">25分钟</span> - 
      ${item.date}
    </div>
  `).join("");
}

historyBtn.addEventListener("click", () => {
  renderHistory();
  historyPanel.style.display = "block";
  settingsPanel.style.display = "none";
});
closeHistoryBtn.addEventListener("click", () => {
  historyPanel.style.display = "none";
});
clearHistoryBtn.addEventListener("click", () => {
  if (confirm("确定清空所有历史记录？")) {
    history = [];
    localStorage.setItem("tomatoHistory", "[]");
    renderHistory();
  }
});

avatar.addEventListener("click", () => {
  speak("我戳了你一下，请说一句鼓励或调侃的话，控制在30字以内。", true);
});

startBtn.addEventListener("click", () => {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startBtn.textContent = "暂停";
  startBtn.classList.add("paused");
  startBtn.style.color = "#fff";  // 暂停时也保持白色

  if (timeLeft <= 0 || timeLeft === totalTime) {
    totalTime = isWorkSession ? 25 * 60 : 5 * 60;
    timeLeft = totalTime;
    progressCircle.style.strokeDashoffset = 0;
  }

  timer = setInterval(() => {
    timeLeft--;
    updateTimer();

    if (timeLeft <= 0) {
      clearInterval(timer);
      isRunning = false;
      startBtn.textContent = "开始专注";
      startBtn.classList.remove("paused");
      startBtn.style.color = "#fff";  // 重置也保持白色

      if (isWorkSession) {
        completedTomatoes++;
        sessionCount++;
        localStorage.setItem("completedTomatoes", completedTomatoes);
        localStorage.setItem("sessionCount", sessionCount);
        updateStats();

        const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' });
        history.push({ task: currentTask, date: today });
        localStorage.setItem("tomatoHistory", JSON.stringify(history));

        speak(`完成第 ${completedTomatoes} 个番茄！休息 5 分钟～`, false);
        isWorkSession = false;
        totalTime = 5 * 60;
        timeLeft = totalTime;

        if (sessionCount % 4 === 0) {
          totalTime = 15 * 60;
          timeLeft = totalTime;
          speak(`第 ${completedTomatoes} 个番茄！奖励长休息 15 分钟！`, false);
        }
      } else {
        speak("休息够啦！再来一轮？", false);
        isWorkSession = true;
        totalTime = 25 * 60;
        timeLeft = totalTime;
      }

      progressCircle.style.strokeDashoffset = 0;
      updateTimer();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  isRunning = false;
  startBtn.textContent = "继续";
  startBtn.style.color = "#fff";  // 继续时也白色
}

function updateTimer() {
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  timerText.textContent = `${minutes}:${seconds}`;

  const progress = timeLeft / totalTime;
  const offset = CIRCUMFERENCE * (1 - progress);
  progressCircle.style.strokeDashoffset = offset;
}

function updateStats() {
  stats.textContent = `今日已完成 ${completedTomatoes} 个番茄`;
}

async function speak(userPrompt, showThinking = true) {
  if (showThinking) {
    thinking.textContent = "思考中...";
  }

  const elapsedSeconds = isWorkSession ? (totalTime - timeLeft) : 0;
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const minutesLeft = Math.ceil(timeLeft / 60);
  const taskDisplay = currentTask ? `“${currentTask}”` : "学习";

  const context = `
我在进行一个番茄钟任务。
- 当前任务：${taskDisplay}
- 今天已完成 ${completedTomatoes} 个番茄
- 距离下次休息还有 ${minutesLeft} 分钟
- 已经专注了 ${elapsedMinutes} 分钟
- 当前是${isWorkSession ? "专注" : "休息"}时段
请参考①已经专注的时间、②距离下次休息的时间、③当前任务，回复一条温柔鼓励或调侃的话，控制在30字以内。
`.trim();

  console.log("【完整 Prompt】\n", personality + "\n" + context + "\n\n用户: " + userPrompt);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "zai-org/GLM-4.6",
        messages: [
          { role: "system", content: personality + "\n" + context },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.9,
        max_tokens: 60
      })
    });

    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    const reply = data.choices[0].message.content.trim();

    thinking.textContent = reply;

  } catch (err) {
    thinking.textContent = "网络错误，戳我重试~";
    console.error("API 错误：", err);
  }
}

updateTimer();
updateStats();
thinking.textContent = "戳我一下试试～";