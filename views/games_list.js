

async function updateGameList() {
    const wat = await fetch("http://localhost:8080/open_games");



}


setInterval(updateGameList, 1000 * 10);