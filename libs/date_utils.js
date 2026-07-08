module.exports = {
    // offsetDays: 0 = today, -1 = yesterday, +1 = tomorrow
    getCurrentDateForToken: (offsetDays = 0) => {
        const now = new Date();
        if (offsetDays !== 0) {
            now.setDate(now.getDate() + offsetDays);
        }

        const formattedDate = new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(now).replace(/\//g, '-');

        return formattedDate;

    }
}