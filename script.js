
// =================================
// وَتيرة - الكود الأساسي
// =================================

let plan = null;

// حفظ الخطة
function savePlan() {
  localStorage.setItem("wateeraPlan", JSON.stringify(plan));
}

// استرجاع الخطة
function loadPlan() {
  const saved = localStorage.getItem("wateeraPlan");

  if (saved) {
    try {
      plan = JSON.parse(saved);
    } catch (error) {
      plan = null;
    }
  }
}

// التنقل بين الصفحات
function showPage(id, button) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const selectedPage = document.getElementById(id);

  if (!selectedPage) return;

  selectedPage.classList.add("active");

  document.querySelectorAll("nav button").forEach(btn => {
    btn.classList.remove("active");
  });

  if (button) {
    button.classList.add("active");
  }

  if (id === "plan") renderPlan();
  if (id === "analytics") renderAnalytics();
}

// توزيع الدروس على الأيام
function distribute(total, days) {
  const base = Math.floor(total / days);
  const extra = total % days;

  return Array.from({ length: days }, (_, index) => {
    return base + (index < extra ? 1 : 0);
  });
}

// إنشاء خطة
function createPlan() {
  const source = document.getElementById("source").value.trim();
  const total = Number(document.getElementById("lessons").value);
  const days = Number(document.getElementById("days").value);

  const message = document.getElementById("message");

  if (!source || !Number.isInteger(total) ||
      !Number.isInteger(days) || total < 1 || days < 1) {
    message.className = "message error";
    message.textContent = "أدخلي البيانات بشكل صحيح.";
    return;
  }

  plan = {
    source,
    total,
    days,
    currentDay: 1,
    completed: [],
    rescheduled: false,
    newDistribution: null
  };

  savePlan();

  message.className = "message success";
  message.textContent = "تم إنشاء خطتك بنجاح 💙";

  showPage("plan");
}

// إنشاء قائمة أرقام الدروس
function getTasks() {
  const distribution = plan.rescheduled && plan.newDistribution
    ? plan.newDistribution
    : distribute(plan.total, plan.days);

  let number = 1;

  return distribution.map(count => {
    const tasks = [];

    for (let i = 0; i < count; i++) {
      tasks.push(number++);
    }

    return tasks;
  });
}

// إنجاز أو إلغاء إنجاز درس
function toggleTask(key) {
  const index = plan.completed.indexOf(key);

  if (index >= 0) {
    plan.completed.splice(index, 1);
  } else {
    plan.completed.push(key);
  }

  savePlan();
  renderPlan();
}

// الانتقال لليوم التالي
function nextDay() {
  if (plan.currentDay < plan.days) {
    plan.currentDay++;
    savePlan();
    renderPlan();
  }
}

// إعادة الجدولة
function reschedule() {
  const remaining = plan.total - plan.completed.length;
  const daysLeft = plan.days - plan.currentDay + 1;

  if (remaining <= 0) {
    alert("أنهيتِ جميع دروس الخطة! أحسنتِ 💙");
    return;
  }

  plan.newDistribution = distribute(
    remaining,
    Math.max(1, daysLeft)
  );

  plan.rescheduled = true;

  savePlan();
  renderPlan();
}

// عرض الخطة
function renderPlan() {
  const container = document.getElementById("planContent");

  if (!container) return;

  if (!plan) {
    container.innerHTML = `
      <div class="card">
        <h2>لا توجد خطة حاليًا</h2>
        <p>ابدئي بإنشاء خطتك الدراسية.</p>
      </div>
    `;
    return;
  }

  const completed = plan.completed.length;
  const remaining = plan.total - completed;
  const percent = Math.round((completed / plan.total) * 100);

  const todayTasks = getTasks()[plan.currentDay - 1] || [];

  let html = `
    <div class="card">
      <h2>${escapeHTML(plan.source)}</h2>
      <p>${plan.total} درس خلال ${plan.days} يوم</p>

      <div class="stats">
        <div class="stat">
          <strong>${plan.total}</strong>
          إجمالي
        </div>
        <div class="stat">
          <strong>${completed}</strong>
          منجز
        </div>
        <div class="stat">
          <strong>${remaining}</strong>
          متبقي
        </div>
        <div class="stat">
          <strong>${percent}%</strong>
          الإنجاز
        </div>
      </div>

      <div class="progress-bg">
        <div class="progress" style="width:${percent}%"></div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <h3>📅 اليوم ${plan.currentDay}</h3>
      <p>مهام اليوم: ${todayTasks.length} دروس</p>
  `;

  todayTasks.forEach(number => {
    const key = "day-" + plan.currentDay + "-" + number;
    const done = plan.completed.includes(key);

    html += `
      <label class="task ${done ? "done" : ""}">
        <input type="checkbox"
          ${done ? "checked" : ""}
          onchange="toggleTask('${key}')">
        الدرس ${number}
      </label>
    `;
  });

  html += `
    </div>

    <div class="card" style="margin-top:16px">
      <h3>🔄 إعادة الجدولة</h3>
      <p>تأخرتِ عن خطتك؟ أعيدي توزيع الدروس المتبقية.</p>

      <button class="main-btn" onclick="reschedule()">
        إعادة الجدولة الآلية
      </button>

      <button class="secondary" onclick="nextDay()">
        اليوم التالي
      </button>
    </div>
  `;

  if (plan.rescheduled && plan.newDistribution) {
    html += `
      <div class="card" style="margin-top:16px">
        <h3>✨ خطتك الجديدة</h3>
    `;

    plan.newDistribution.forEach((count, index) => {
      html += `
        <p>
          اليوم ${plan.currentDay + index} — ${count} درس
        </p>
      `;
    });

    html += `</div>`;
  }

  container.innerHTML = html;
}

// حماية اسم المادة عند عرضه
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// تحليلات الأداء
function renderAnalytics() {
  const container = document.getElementById("analyticsContent");

  if (!container) return;

  if (!plan) {
    container.innerHTML = `
      <div class="card">
        <h3>ابدئي رحلتك مع وَتيرة 💙</h3>
        <p>أنشئي خطة أولًا حتى نعرض تحليلك.</p>
      </div>
    `;
    return;
  }

  const completed = plan.completed.length;
  const remaining = plan.total - completed;
  const percent = Math.round((completed / plan.total) * 100);

  container.innerHTML = `
    <div class="analytics-grid">
      <div class="analytics-box">
        <strong>${plan.total}</strong>
        <span>إجمالي الدروس</span>
      </div>

      <div class="analytics-box">
        <strong>${completed}</strong>
        <span>المنجز</span>
      </div>

      <div class="analytics-box">
        <strong>${remaining}</strong>
        <span>المتبقي</span>
      </div>

      <div class="analytics-box">
        <strong>${percent}%</strong>
        <span>نسبة الإنجاز</span>
      </div>
    </div>

    <div class="chart-card">
      <h3>تقدمك الدراسي</h3>
      <div class="progress-bg">
        <div class="progress" style="width:${percent}%"></div>
      </div>
      <p>${percent}% من خطتك اكتمل</p>
    </div>
  `;
}

// استرجاع البيانات عند فتح التطبيق
loadPlan();

// عرض الخطة عند فتح صفحة خطتي
renderPlan();
