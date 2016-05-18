var server = require('http').createServer(handler)
  , io = require('socket.io').listen(server)
  , fs = require('fs');


server.setMaxListeners(1000);
//io.setMaxListeners(0);

server.listen(3000, function(){
  console.log('listening on *:3000');
});

//start node monitor
//var app = require('appmetrics-dash').start({server:server});


var clients = {};
var control_client = {};
var userIdArray = [];
var selectedUserIdArray = [];


var player1_socket_id = null;
var player2_socket_id = null;


function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
  // chamath
  socket.setMaxListeners(1000);


  socket.on('add-user', function(data){


    console.log("socket ID" + socket.id);
    console.log("Name " + data.username);


    if (data.username  == "mainScreen" || data.username == "gameScreen"){
      control_client[data.username] = {
        "socket": socket.id
      };


      console.log("start");
      console.log(control_client);
      console.log("end");

    }else{
      clients[data.userId] = {
        "socket": socket.id,
        "username":data.username,
        "img":data.img
      };

      userIdArray.push(data.userId);

      // send main screen to user
      io.sockets.connected[control_client["mainScreen"].socket].emit("add-connected", {"username":data.username,"userId":data.userId,"img":data.img});



      console.log("start");
      console.log(clients);
      console.log(userIdArray);
      console.log("end");


    }

  });



  //socket.on('private-message', function(data){
  //  console.log("Sending: " + data.content + " to " + data.username);
  //  if (clients[data.username]){
  //    io.sockets.connected[clients[data.username].socket].emit("add-message", data);
  //
  //  } else {
  //    console.log("User does not exist: " + data.username);
  //  }
  //});


  //game control

  socket.on('click_function', function(data){
    console.log("click event " + data + "client" + socket.id) ;


    if (socket.id == player1_socket_id ){
      if (data == "UpRelease"){
        io.sockets.connected[control_client["gameScreen"].socket].emit("game_control_data", {"pressedKey":"p1UpRelease"});
      }else if (data == "UpPress"){
        io.sockets.connected[control_client["gameScreen"].socket].emit("game_control_data", {"pressedKey":"p1UpPress"});
      }else if (data == "DownRelease"){
        io.sockets.connected[control_client["gameScreen"].socket].emit("game_control_data", {"pressedKey":"p1DownRelease"});
      }else if (data == "DownPress"){
        io.sockets.connected[control_client["gameScreen"].socket].emit("game_control_data", {"pressedKey":"p1DownPress"});
      }

    }else if (socket.id == player2_socket_id ){
      if (data == "UpRelease"){
        io.sockets.connected[control_client["gameScreen"].socket].emit("game_control_data", {"pressedKey":"p2UpRelease"});
      }else if (data == "UpPress"){
        io.sockets.connected[control_client["gameScreen"].socket].emit("game_control_data", {"pressedKey":"p2UpPress"});
      }else if (data == "DownRelease"){
        io.sockets.connected[control_client["gameScreen"].socket].emit("game_control_data", {"pressedKey":"p2DownRelease"});
      }else if (data == "DownPress"){
        io.sockets.connected[control_client["gameScreen"].socket].emit("game_control_data", {"pressedKey":"p2DownPress"});
      }
    }

  });




  //Removing the socket on disconnect
  socket.on('disconnect', function() {
  	for(var userId in clients) {
  		if(clients[userId].socket === socket.id) {

          // send socket id to main screen to remove item
          io.sockets.connected[control_client["mainScreen"].socket].emit("remove-connected", {"userId":userId});

          delete clients[userId];

          //remove user id from user id array
          var userIdIndex = userIdArray.indexOf(userId);

          if (userIdIndex != -1){
            userIdArray.splice(userIdIndex,1);
          }else{
            // in user id not in the main array then check the selected user array
            var userIdIndex = selectedUserIdArray.indexOf(userId);
            if (userIdIndex != -1){
              selectedUserIdArray.splice(userIdIndex,1);
            }else{
              console.log("Disconnected user not in the any array some thing wrong with logic");
            }
          }
          break;
  		}
  	}

    //delete control clients
    for(var name2 in control_client) {
      if(control_client[name2].socket === socket.id) {
        delete control_client[name2];
        break;
      }
    }

  });


  io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
      console.log('user disconnected');
    });
  });




  socket.on('buttonClickEvent', function(data){
    console.log(data);

    if (data == "selectPlayers"){
      selectButtonPress();
    }else if (data == "endGame"){
      endGame();
    }



  });


  socket.on('confirmButton', function(data){
    console.log("player confirm event " + data + "client" + socket.id) ;
    if (socket.id == player1_socket_id){
      if (data == "playerConfirm"){
        player1Confirm();

      }else{
        player1Reject();
        console.log("player 1 rejected");
      }

    }else if (socket.id == player2_socket_id){
      if (data == "playerConfirm"){
        player2Confirm();

      }else{

        player2Reject();
        console.log("player 2 rejected");
      }

    }


  });



  function selectButtonPress(){
    console.log("Selecting ......");

    // trigger main screen state change
    io.sockets.connected[control_client["mainScreen"].socket].emit("stateChange", "load_player_selecting_screen");

    ////need function for here
    //player1_socket_id = clients[playerSelect()[0]].socket;
    //player2_socket_id = clients[playerSelect()[1]].socket;
    //
    //console.log(player1_socket_id);
    //console.log(player2_socket_id);
    //
    //// show selected players in main screen
    //io.sockets.connected[control_client["mainScreen"].socket].emit("showSelectedPlayers",
    //    {"player1":clients[playerSelect()[0]].username,"player2":clients[playerSelect()[1]].username});
    //
    //// send players to notification
    //io.sockets.connected[player1_socket_id].emit("notification", "you have selected as player 1");
    //io.sockets.connected[player2_socket_id].emit("notification", "You have selected as player 2");
    //
    ////load the game
    //io.sockets.connected[control_client["gameScreen"].socket].emit("stateChange", "load_Game");

    selectPlayer1();
    selectPlayer2();
  }

  // to do need to set confirmation and time out and recall if confirm need to remove time
  // out and send player to screen  change notification

  function selectPlayer1(){
    io.sockets.connected[control_client["mainScreen"].socket].emit("stateChange", "selecting player 1");
    var selectedPlayerId1  = playerSelect();
    player1_socket_id = clients[selectedPlayerId1].socket;

    console.log("player 1 socket id" + player1_socket_id);


    // show selected players in main screen
    io.sockets.connected[control_client["mainScreen"].socket].emit("showSelectedPlayers",
        {"player1":clients[selectedPlayerId1].username});

    // send players to notification
    io.sockets.connected[player1_socket_id].emit("notification", "confirm");
  }

  function selectPlayer2(){
    io.sockets.connected[control_client["mainScreen"].socket].emit("stateChange", "selecting player 2");
    var selectedPlayerId2  = playerSelect();
    player2_socket_id = clients[selectedPlayerId2].socket;


    console.log("player 2 socket id" + player2_socket_id);

    // show selected players in main screen
    io.sockets.connected[control_client["mainScreen"].socket].emit("showSelectedPlayers",
        {"player2":clients[selectedPlayerId2].username});

    // send players to notification
    io.sockets.connected[player2_socket_id].emit("notification", "confirm");

  }


  // select random player form pool
  function playerSelect(){

    // need algorithm here
    var selectedIndex = Math.floor((Math.random() * userIdArray.length));
    var userId = userIdArray[selectedIndex];
    userIdArray.splice(selectedIndex,1);
    selectedUserIdArray.push(userId);

    console.log("selected index" + userId);
    console.log(selectedUserIdArray);
    console.log(userIdArray);

    return userId;

  }

  function player1Confirm(){
    io.sockets.connected[control_client["mainScreen"].socket].emit("stateChange", "Player 1 Confirmed");
    io.sockets.connected[player1_socket_id].emit("notification", "player1Ok");

  }

  function player2Confirm(){
    io.sockets.connected[control_client["mainScreen"].socket].emit("stateChange", "Player 2 Confirmed");
    io.sockets.connected[player2_socket_id].emit("notification", "player2Ok");

  }

  function player1Reject(){
    io.sockets.connected[control_client["mainScreen"].socket].emit("stateChange", "Player 1 Reject");
    selectPlayer1();
  }

  function player2Reject(){
    io.sockets.connected[control_client["mainScreen"].socket].emit("stateChange", "Player 2 Reject");
    selectPlayer2();
  }




  function endGame(){
    // trigger main screen state change
    io.sockets.connected[control_client["mainScreen"].socket].emit("stateChange", "load game lobby ");


    //change the player screen
    io.sockets.connected[player1_socket_id].emit("notification", "game finished");

    io.sockets.connected[player2_socket_id].emit("notification", "game finished");

    //change game screen
    io.sockets.connected[control_client["gameScreen"].socket].emit("stateChange", "load_QR_code");

  }





});



