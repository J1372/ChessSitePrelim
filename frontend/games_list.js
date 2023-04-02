const myGameList = document.getElementById("openGamesTable");
const createGameButton = document.getElementById("createGame");
const refreshButton = document.getElementById("refreshGames");

async function attemptJoinGame(uuid) {
    const joinResponse = await fetch("http://localhost:8080/join-game",
    {
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },

        method: "post",
        body: JSON.stringify({uuid: uuid}),
    });

    const successful = joinResponse.status === 200;

    if (successful) {
        window.location.href = 'http://localhost:8080/game/' + uuid;
    } else {
        console.log(joinResponse);
    }
}

async function updateGameList() {
    const createdResponse = await fetch("http://localhost:8080/get-open-games");

    const resp = await createdResponse.json();
    console.log(resp);

    while (myGameList.lastElementChild != myGameList.firstChild) {
        myGameList.removeChild(myGameList.lastElementChild);
    }

    const tableBody = document.createElement('tbody');
    myGameList.appendChild(tableBody);

    resp.forEach(element => {
        console.log(element);
        const listElement = document.createElement('tr');

        const hostCol = document.createElement('td');
        const timeCol = document.createElement('td');
        const postedCol = document.createElement('td');
        const uuidCol = document.createElement('td');

        hostCol.appendChild(document.createTextNode(element.host));
        timeCol.appendChild(document.createTextNode(element.timeControl));
        postedCol.appendChild(document.createTextNode(element.posted));
        uuidCol.appendChild(document.createTextNode(element.uuid));
        
        listElement.appendChild(hostCol);
        listElement.appendChild(timeCol);
        listElement.appendChild(postedCol);
        listElement.appendChild(uuidCol);

        listElement.addEventListener('click', async () => {
            await attemptJoinGame(listElement.lastChild.textContent);
        });

        tableBody.appendChild(listElement);
    });
}

refreshButton.addEventListener('click', async ()=> {
    updateGameList();
});

createGameButton.addEventListener('click', ()=> {
    if (waitingSecondPlayerListener === null) {
        document.getElementById("createGameForm").style.display = "block";
    }
});

const createGameButton2 = document.getElementById("createGame2");

let waitingSecondPlayerListener = null;


createGameButton2.addEventListener('click', async (e)=> {
    if (waitingSecondPlayerListener !== null) {
        return; // client-side, if already waiting, don't send to server.
    }

    e.preventDefault();

    const minutes = document.getElementById('minsInput').value;
    const increment = document.getElementById('incrInput').value;
    const delay = document.getElementById('delayInput').value;

    const settings = {
        startingMins: minutes,
        increment: increment,
        delay: delay,
    }

    const createdResponse = await fetch("http://localhost:8080/create-game", 
    {
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        
        method: "post",
        body: JSON.stringify(settings),
    });

    if (createdResponse.status !== 200) { // probably, user already has a game posted.
        return;
    }

    const uuid = await createdResponse.text();

    const toGameURL = 'http://localhost:8080/game/' + uuid;
    const sseURL = toGameURL + '/waiting';
    waitingSecondPlayerListener = new EventSource(sseURL);
    waitingSecondPlayerListener.addEventListener('message', _ => { 
        waitingSecondPlayerListener.close();
        window.location.href = toGameURL;
    });
    waitingSecondPlayerListener.onerror = () => waitingSecondPlayerListener.close();

    console.log('Waiting for players for game ' + uuid);

    document.getElementById("createGameForm").style.display = 'none';

    updateGameList();
});


updateGameList();
