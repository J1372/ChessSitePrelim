const localDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'numeric',
    day:'numeric',
    hour:'numeric',
    minute:'numeric'
});

// get a locale date string ~ month/day hour:min
export function clientsideDateString(date) {
    const localDateTime = localDateTimeFormatter.format(date);
    return localDateTime;
}
