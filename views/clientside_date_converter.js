const localDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'numeric',
    day:'numeric',
    hour:'numeric',
    minute:'numeric'
});

const toConvert = document.getElementsByClassName('date-time');
for (const dateElem of toConvert) {
    const date = new Date(dateElem.innerText);
    // get a locale date string ~ month/day hour:min
    const localDateTime = localDateTimeFormatter.format(date);

    dateElem.innerText = localDateTime;
};
