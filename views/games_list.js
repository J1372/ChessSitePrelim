

const myGameList = document.getElementById("openGamesTable");
const createGameButton = document.getElementById("createGame");
const refreshButton = document.getElementById("refreshGames");

async function updateGameList() {
    const wat = await fetch("http://localhost:8080/get-open-games");

    console.log(wat);
}



refreshButton.addEventListener('click', async ()=> {
    updateGameList();
});

createGameButton.addEventListener('click', async ()=> {
    const createdResponse = await fetch("http://localhost:8080/create-game", 
    {
        method: "post",
    });

    console.log(createdResponse);



});

// every 30s
setInterval(updateGameList, 1000 * 30);
