var server = require('http').createServer(handler)
    , io = require('socket.io').listen(server)
    , fs = require('fs');

//mysql
var mysql      =  require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'pong'
});

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected as id ' + connection.threadId);
});




//-------------~~~~~~~~~~~~-----------//

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
var player1_user_id = null;
var player2_user_id = null;


var player1confirm = false;
var player2confirm = false;

var player2timeOut;
var player1timeOut;


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

      var imgSrc = data.img;
      if (imgSrc == null){
        imgSrc = "need to default path";

      }

      if (!(data.userId in clients)) {


        clients[data.userId] = {
          "socket": socket.id,
          "username": data.username,
          "img": imgSrc
        };

        ////insert to database
        //var dataDict = {playerId: data.userId, playerName: data.username, img: imgSrc, score: 0};
        //var query = connection.query('INSERT INTO `player` SET ? ON DUPLICATE KEY UPDATE playerId = playerId', dataDict, function (err, result) {
        //  if (err) {
        //    console.error('error connecting: ' + err.stack);
        //    return;
        //  }
        //  console.log('connected as id ' + result);
        //
        //});


        userIdArray.push(data.userId);

        // send main screen to user
        io.emit("mainScreen-add-connected", {
          "username": data.username,
          "userId": data.userId,
          "img": data.img
        });

      }



      console.log("start");
      console.log(clients);
      console.log(userIdArray);
      console.log("end");


    }

  });

  //Removing the socket on disconnect
  socket.on('disconnect', function() {
    for(var userId in clients) {
      if(clients[userId].socket === socket.id) {

        // send socket id to main screen to remove item
        io.emit("mainScreen-remove-connected", {"userId":userId});

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
    io.emit("mainScreen-stateChange", "load_player_selecting_screen");

    //marge previous  players
    userIdArray = userIdArray.concat(selectedUserIdArray);
    selectedUserIdArray = [];

    console.log("user id array" + userIdArray);

    selectPlayer1();
    selectPlayer2();
  }

  // to do need to set confirmation and time out and recall if confirm need to remove time
  // out and send player to screen  change notification

  function selectPlayer1(){
    io.emit("mainScreen-stateChange", "selecting player 1");


    if (checkPlayers()){
      player1_user_id  = playerSelect();
      player1_socket_id = clients[player1_user_id].socket;

      console.log("player 1 socket id" + player1_socket_id);


      // show selected players in main screen
      io.emit("mainScreen-showSelectedPlayers",
          {"player1":clients[player1_user_id].username});

      // send players to notification
        try{
            io.sockets.connected[player1_socket_id].emit("notification", "confirm");
        }
        catch (err){
            console.log(err);
        }

      //set time out
      player1timeOut = setTimeout(selectPlayer1, 10000);

    }else{
      clearTimeout(player1timeOut);
    }

  }

  function selectPlayer2(){
    io.emit("mainScreen-stateChange", "selecting player 2");

    if (checkPlayers()){
      player2_user_id  = playerSelect();
      player2_socket_id = clients[player2_user_id].socket;


      console.log("player 2 socket id" + player2_socket_id);

      // show selected players in main screen
      io.emit("mainScreen-showSelectedPlayers",
          {"player2":clients[player2_user_id].username});

      // send players to notification
        try{
            io.sockets.connected[player2_socket_id].emit("notification", "confirm");
        }
        catch (err){
            console.log(err);
        }


      player2timeOut = setTimeout(selectPlayer2, 10000);
    }else{
      clearTimeout(player2timeOut);
    }
  }

  function checkPlayers(){
    if (userIdArray.length > 0){
      return true ;
    } else{
      io.emit("mainScreen-stateChange", "No Players in the pool");
      return false ;
    }

  }


  // select random player form pool
  function playerSelect(){

    // need algorithm here

    var selectedIndex = Math.floor((Math.random() * userIdArray.length));
    var userId = userIdArray[selectedIndex];
    userIdArray.splice(selectedIndex,1);
    console.log("user id array" + userIdArray);
    selectedUserIdArray.push(userId);

    console.log("selected index" + userId);
    console.log(selectedUserIdArray);
    console.log(userIdArray);

    return userId;

  }

  function player1Confirm(){
    player1confirm = true;

    var tempuser1 = clients[player1_user_id];
    io.emit("mainScreen-player1confirm", {"username":tempuser1.username,"userId":tempuser1.userId,"img":tempuser1.img});

      try{
          io.sockets.connected[player1_socket_id].emit("notification", "player1Ok");
      }
      catch (err){
          console.log(err);
      }

    clearTimeout(player1timeOut);
    startGame();

  }

  function player2Confirm(){
    player2confirm = true;
    var tempuser2 = clients[player2_user_id];
    io.emit("mainScreen-player2confirm", {"username":tempuser2.username,"userId":tempuser2.userId,"img":tempuser2.img})

      try{
          io.sockets.connected[player2_socket_id].emit("notification", "player2Ok");
      }
      catch (err){
          console.log(err);
      }

    clearTimeout(player2timeOut);
    startGame();

  }

  function player1Reject(){
    io.emit("mainScreen-stateChange", "Player_1_Reject");
    selectPlayer1();
  }

  function player2Reject(){
    io.emit("mainScreen-stateChange", "Player_2_Reject");
    selectPlayer2();
  }

  function startGame(){



    if (player1confirm && player2confirm){
      var tempuser1 = clients[player1_user_id];
      var tempuser2 = clients[player2_user_id];

      io.emit("gameScreen-load_Game", [{"username":tempuser1.username,"userId":tempuser1.userId,"img":tempuser1.img},{"username":tempuser2.username,"userId":tempuser2.userId,"img":tempuser2.img}]);
      //io.sockets.connected[control_client["gameScreen"].socket].emit("stateChange", "load_Game");
    }


  }




  function endGame(){
    // trigger main screen state change
    io.emit("mainScreen-stateChange", "load game lobby ");


    //change the player screen
      try{
          io.sockets.connected[player1_socket_id].emit("notification", "game finished");

          io.sockets.connected[player2_socket_id].emit("notification", "game finished");
      }
      catch (err){
          console.log(err);
      }


    //change game screen
    io.emit("gameScreen-stateChange", "load_QR_code");

  }





});



