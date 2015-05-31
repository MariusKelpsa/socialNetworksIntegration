// Facebook prototipas
function Facebook() {
    myQueue = new Array();
}

// Facebook API 
Facebook.prototype = {
        
/* ------ setter'iai ---------------*/
    setArgs : function(args) {
        this.args = args;
    },

    setFriendsCallback : function(callback) {
        this.friendsCallback = callback;
    },

    setMyCallback : function(callback) {
        this.myCallback = callback;
    },
    
    setAppId : function(appId) {
        this.appId = appId;
    },
    
    setApiVersion : function(apiVersion) {
        this.apiVersion = apiVersion;
    },

/* ---------- API inicializacija -------------------- */
    initAPI : function() {
        var fbPrototype = this;
        window.fbAsyncInit = function() {
            FB.init({
                appId : fbPrototype.appId,
                xfbml : true,
                status : true,
                cookie : true,
                version : fbPrototype.apiVersion
            });

            FB.getLoginStatus(function(response) {
                if (response.status === 'connected') {
 /* èia pradedam vykdyti veiksmø eilë, kad visi API veiksmai bûti vykdomi tik tada, kai naudotojas prisijungæs*/
                    processQueue.call(fbPrototype);
                }
            });

        };

        /* Pakraunamas Facebook SDK */ 
        (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id))
                return;
            js = d.createElement(s);
            js.id = id;
            js.src = "//connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));

    },

/* --------- iðorinë(kvieèiama) naudotojo informacijos gavimo funkcija ------------*/
    getMyInfo : function(args, callback) {
    /* iðsaugomi argumentai ir funkcija, kurià reikës vykdyt jau su rezultatu */
        this.setMyCallback(callback);
        this.setArgs(args);
    /* vidinë funkcija, kurioje visa logika, pridedama á veiksmø eilæ*/
        queueAddFB.call(this, this.getMyInfoInternal);
    },

/* --------- iðorinë(kvieèiama) naudotojo draugø informacijos gavimo funkcija ------------*/
    getFriendsInfo : function(args, callback) {
    /* argumentø nëra, tad iðsaugoma tik funkcija, kurià reikës vykdyt jau su rezultatu */
        this.setFriendsCallback(callback);
        this.setArgs(args);
    /* vidinë funkcija, kurioje visa logika, pridedama á veiksmø eilæ*/
        queueAddFB.call(this, this.getFriendsInfoInternal);
    },
    

/* -------- naudotojo informacijos gavimo funkcijos logika ------------*/
    getMyInfoInternal : function() {
/* pasiimam argumentus ir funkcijà, kuriai perduosim rezultatà */
        var callback = this.myCallback;
        var args = this.args;
        var params = {
            height :100,
            width : 100
        };
        
/* kiekvienam argumentui, jei jis yra, iðsprendþiam Facebook API reikðmes */
        if (args.photoSize) {
            var height = 100; // default
            var width = 100; // default
            switch (args.photoSize) {
            case 50:
                height = 50;
                width = 50;
                break;
            case 100:
                height = 100;
                width = 100;
                break;
            case 200:
                height = 200;
                width = 200;
                break;
            }
            params.height = height;
            params.width = width;
        }

/* su iðspræstomis reikðmëmis kvieèiame Facebook api ir formuojame rezultatà*/
        var myInfo = {};
        FB.api('/me/picture', params, function(response) {
            if (response && !response.error) {
                if (response.data) {
                    /* jei pavyksta gauti paveiksliukà, já pridedame á rezultatà */
                    var picture = response.data.url;
                    if (picture)
                        myInfo.picture = picture;
                }
            } else {
  /* jei Facebook API kaþkas nepavyko ir gràþinamas response.error, tai ir mes tai perduodam á tarpinæ API*/
                callback(response);
            }
  /* jei vienai tarpinio API funkcijai reikia kviesti kelias Facebook API, tai jos turi vykti asinchroniðkai, kad rezultatas bûtø pilnas */
            FB.api('/me', function(response) {
                if (response && !response.error) {
                    myInfo.name = response.name;
                    myInfo.id = response.id;
  /* paskutinë funkcija gràþina rezultatà, nes jis tikrai jau pilnas */
                    callback(myInfo);
                } else {
                    callback(response);
                }
            });
        });
        
    },

/* -------- naudotojo draugø informacijos gavimo funkcijos logika ------------*/    
    getFriendsInfoInternal : function() {
        /* -------- visas principas identiðkas aukðèiau apraðytajam ------------*/
        var fbPrototype = this;
        var callback = this.friendsCallback;
        var args = this.args;
        var params = {
            height :100,
            width : 100
        };
        
/* kiekvienam argumentui, jei jis yra, iðsprendþiam Facebook API reikðmes */
        if (args.photoSize) {
            var height = 100; // default
            var width = 100; // default
            switch (args.photoSize) {
            case 50:
                height = 50;
                width = 50;
                break;
            case 100:
                height = 100;
                width = 100;
                break;
            case 200:
                height = 200;
                width = 200;
                break;
            }
            params.height = height;
            params.width = width;
        }
        FB.api("/me/friends", function(response) {
            if (response && !response.error) {
                var allFriends = response.data;
                var friendsList = [];
                var i = 0;
                var j = 0;
                allFriends.forEach(function(arrayElement) {
                    var id = allFriends[i].id;
                    friendsList[i] = {
                        name : allFriends[i].name,
                        id : id
                    };
                    FB.api('/'+id+'/picture', params, function(response) {
                        if (response && !response.error) {
                            if (response.data) {
                                /* jei pavyksta gauti paveiksliukà, já pridedame á rezultatà */
                                var picture = response.data.url;
                                if (picture)
                                    friendsList[j].picture = picture;
                            }
                            if (j + 1 == allFriends.length) {
                                fbPrototype.getInvitableFriendsInfo(
                                    function(response){
                                        var allFriendsInfo = friendsList;
                                        if (response.data && response.data.length > 0){
                                            allFriendsInfo = friendsList.concat(response.data);
                                        }
                                        callback({ data : allFriendsInfo });
                                    }  
                                );
                            } 
                            j++;
                        }
                    });
                    i++;
                });
            } else {
                callback(response);
            }
        });
    },
    
    
    getInvitableFriendsInfo : function(callback) {
        FB.api("/me/invitable_friends", function(response) {
            if (response && !response.error) {
                var allFriends = response.data;
                var friendsList = [];
                var i = 0;
                allFriends.forEach(function(friend) {
                    var id = friend.id;
                    friendsList[i] = {
                        name : friend.name,
                        id : id,
                        picture : friend.picture.data.url
                    };
                    if (i + 1 == allFriends.length) {
                        var friendsInfo = {
                            data : friendsList
                        };
                        callback(friendsInfo);
                    } 
                    i++;
                });
            }
        });
    },
    
    postOnWall : function(args, callback) {
        var postResponse = {};
        
        FB.api( "/me/feed",
                "POST",
                {
                    "message": args.message
                },
                function (response) {
                  if (response && !response.error) {
                      postResponse.success = true;
                  } else {
                      postResponse.success = false;
                  }
                  callback(postResponse);
                }
            );
    },
    
    getAchievements : function(callback) {
        var fbPrototype = this;
        var myResponse = {
            data : []
        };
        FB.api("/me/achievements", 
            function(response){
                if (!response.error && response.data && response.data.length > 0){
                    var i = 0;
                    response.data.forEach(function(achievementData) {
                        var id = achievementData.data.achievement.id;
                        FB.api(fbPrototype.appId + "/achievements", 
                            function(r){
                                if (!r.error && r.data){
                                    for (var j = 0; j < r.data.length; j++) {
                                        if(r.data[j].id = id) {
                                            var data = {};
                                            data.title = r.data[j].title;
                                            data.url = r.data[j].url;
                                            data.description = r.data[j].description;
                                            data.image = r.data[j].image[0].url;
                                            data.points = r.data[j].data.points;
                                            data.id = achievementData.id;
                                            myResponse.data[i] = data;
                                            break;
                                        }
                                    }
                                }
                                if (i + 1 == response.data.length) {
                                    callback(myResponse);
                                } 
                                i++;
                        });
                    });
                } else {
                    callback(myResponse);
                }
            }
        );
    },
    
    postAchievement : function(achievement, callback) {
        var myResponse = {};
        FB.api("me/games.achieves", 
                "POST",
                { "achievement" : achievement,
                  "fb:explicitly_shared" : true },
                function(response){
                   if (response.error){
                      myResponse.success = false;
                   } else {
                      myResponse.success = true;
                   }
                   callback(myResponse);
                }
            );
    },
    
    deleteAchievement : function(achievement, callback){
        var myResponse = {};
        FB.api("me/achievements", 
                function(response){
                    if (!response.error && response.data){
                        var allAchievements = response.data;
                        for (var i = 0; i < allAchievements.length; i++) {
                            if (allAchievements[i].data.achievement.url == achievement) {
                                myResponse.success = false;
                                FB.api(allAchievements[i].id, 
                                        "DELETE",
                                        function(response){
                                            if (!response.error) {
                                                myResponse.success = true;
                                            }
                                            callback(myResponse);
                                        }
                                    );
                                break;
                            }
                        }
                        if (typeof myResponse.success  === 'undefined') {
                            myResponse.success = false;
                            callback(myResponse);
                        }
                    } else {
                        myResponse.success = false;
                        callback(myResponse);
                    }
                }
            );
    },
    
    setScore : function(score, callback) {
        var myResponse = {};
        FB.api("me/scores", 
                "POST",
                { "score" : score },
                function(response){
                   if (response && !response.error){
                      myResponse.success = true;
                   } else {
                      myResponse.success = false;
                   }
                   callback(myResponse);
                }
            );
    },
    
    getHighScores : function(callback) {
        var myResponse = {
            data : []
        };
        var access_token = FB.getAuthResponse()['accessToken'];
        FB.api(this.appId + "/scores",
            {"access_token" : access_token},
            function(response){
                if (response && response.data && response.data.length > 0){
                    for (var i = 0; i < response.data.length; i++) {
                        var data = {};
                        data.id = response.data[i].user.id;
                        data.name = response.data[i].user.name;
                        data.score = response.data[i].score;
                        myResponse.data[i] = data;
                    }
                } 
                callback(myResponse);
            }
        );
    },
    
    inviteFriends : function(args) {
        FB.ui({
            "method": "apprequests",
            "message": args.message
        });
    }
};