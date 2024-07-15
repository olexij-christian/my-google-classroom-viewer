const LoginElement = Element("login");
const LoadingElement = Element("loading");
const TableElement = ElementTableAPI(Element("table"));
const ExitButton = Element("exitBtn");

const App = Frames([LoginElement, LoadingElement, TableElement]);

LoadingElement.setDefaultLabelText = function () {
  LoadingElement.label.innerText = "Завантаження інформації з Google classroom";
};

LoadingElement.setDefaultLabelText();

TableElement.setHeader([
  "Назва курсу",
  "Назва задачі",
  "Стан роботи",
  "Час і дата",
  "Посилання",
]);

let lastUpdateTime;

window.electronAPI.onGetLastUpdateTime((event, time) => {
  lastUpdateTime = time;
});

document.getElementById("exitBtn").addEventListener("click", () => {
  window.electronAPI.exitAccount();
});

LoginElement.btn.addEventListener("click", () => {
  window.electronAPI.onAuthorize(() => App.show(LoadingElement));

  window.electronAPI.onInternetConnectProblem(() => {
    function loop(index) {
      LoadingElement.label.innerText = `Проблема з підключення спробую через ${index} мс.`;
      if (index > 1) setTimeout(() => loop(index - 100), 100);
      else LoadingElement.setDefaultLabelText();
    }
    setTimeout(() => loop(2000), 100);
  });

  window.electronAPI.onCourseStartLoading(
    (event, courseName, percent) =>
      (LoadingElement.label.innerText = `Завантажую роботи з курсу "${courseName}" [ ${percent}% ]`)
  );

  window.electronAPI.onCourseFullLoaded((event, list) => {
    for (const {
      courseName,
      courseWorkTitle,
      state,
      updateTime,
      alternateLink,
    } of list) {
      if (courseName === "10-А") continue;

      let config = {};

      if (new Date(updateTime).getTime() > lastUpdateTime.getTime())
        config.attention = true;
      else config.attention = false;

      // only created task remove from list
      if (state === "CREATED") continue;

      TableElement.addLine(
        [
          courseName,
          courseWorkTitle,
          translateState(state),
          new Date(updateTime).toLocaleString("uk-UA"),
          DomButton("Перейти за посиланням", () =>
            window.electronAPI.open(alternateLink)
          ),
        ],
        config
      );
    }

    App.show(TableElement);

    window.electronAPI.saveLastUpdateTime();
  });

  // run all events firstly "onAuthorize" next "onCouseStartLoading" for every course and last "onCouseFullLoaded"
  window.electronAPI.getClassroomData();
});

window.electronAPI.onIsAuthorized((event, isAuthorized) => {
  if (isAuthorized) {
    LoginElement.label.innerText =
      "Натиніть на кнопку щоб тримати інформацію з Google classroom";
    LoginElement.btn.innerText = "Старт";
    ExitButton.show();
  } else {
    LoginElement.label.innerText =
      "Будь-ласка авторизуйтеся в ваш акаунт Google";
    LoginElement.btn.innerText = "Авторизуватися";
  }
});

window.electronAPI.init();

function Frames(elements) {
  const elementsMap = new Set();
  elements.forEach((elem) => elementsMap.add(elem));
  return {
    show: (elem) => {
      elementsMap.forEach((elem) => elem.hide());
      elem.show();
    },
  };
}

function ElementTableAPI(element) {
  const CSS_HEAD = ".thead";
  const CSS_BODY = ".tbody";

  function Th(label) {
    const res = document.createElement("th");

    res.innerText = label;

    return res;
  }

  function Td(elementOrLabel) {
    const res = document.createElement("td");

    if (typeof elementOrLabel === "string") res.innerText = elementOrLabel;
    else res.appendChild(elementOrLabel);

    return res;
  }

  function Tr(elements, { attention } = { attention: false }) {
    const CSS_ATTENTION = "attention";

    const res = document.createElement("tr");

    res.append(...elements);

    if (attention) res.classList.add(CSS_ATTENTION);

    return res;
  }

  const header = element.native.querySelector(CSS_HEAD);
  const body = element.native.querySelector(CSS_BODY);

  return {
    ...element,
    header,
    body,
    setHeader: (labels) => {
      labels.forEach((text) => header.appendChild(Th(text)));
    },
    addLine: (elements, config) => {
      const tdList = elements.map((elementOrLabel) => Td(elementOrLabel));

      body.appendChild(Tr(tdList, config));
    },
  };
}

function DomButton(label, onclick = () => {}) {
  const res = document.createElement("button");

  res.innerText = label;

  res.addEventListener("click", onclick);

  return res;
}

function Element(ID) {
  const CSS_HIDED = "hided";
  const CSS_LABEL = ".label";
  const CSS_BTN = ".btn";

  const element = document.getElementById(ID);

  const res = {
    native: element,
    hide: () => element.classList.add(CSS_HIDED),
    show: () => element.classList.remove(CSS_HIDED),
  };

  const label = element.querySelector(CSS_LABEL);
  if (label) res.label = label;

  const btn = element.querySelector(CSS_BTN);
  if (btn) res.btn = btn;

  return res;
}

function translateState(state) {
  const translations = {
    CREATED: "Створено",
    TURNED_IN: "Здано",
    RECLAIMED_BY_STUDENT: "Відкликано студентом",
  };
  return translations[state] || state;
}
