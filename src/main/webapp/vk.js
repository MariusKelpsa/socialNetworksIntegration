// Vkontakte prototipas, kuriame visa struktûra analogiðka Facebook, tik skiriasi API iðsprendimo logika
function Vkontakte() {
    myQueue = new Array();
}

Vkontakte.prototype = {

    addFieldValue : function(fields, value) {
        if (fields) {
            fields += ',';
        }
        fields += value;
        return fields;
    },

    setArgs : function(args) {
        this.args = args;
    },

    setFriendsCallback : function(callback) {
        this.friendsCallback = callback;
    },

    setMyCallback : function(callback) {
        this.myCallback = callback;
    },
    
    setData : function(data) {
        this.data = data;
    },
    
    initAPI : function() {
        var vkPrototype = this;

        VK.init(
        function(){
            var response = {
                    session : true
                };
                authInfo(response);
            });

        function authInfo(response) {
            if (response.session) {
                processQueue.call(vkPrototype);
            }
        }

    },

    getMyInfo : function(args, callback) {
        this.setMyCallback(callback);
        this.setArgs(args);
        queueAddVK.call(this, this.getMyInfoInternal);
    },

    getFriendsInfo : function(args, callback) {
        this.setFriendsCallback(callback);
        this.setArgs(args);
        queueAddVK.call(this, this.getFriendsInfoInternal);
    },

    getMyInfoInternal : function() {
        var callback = this.myCallback;
        var args = this.args;
        var fields = '';
        
        var photo = "photo_100"; // default
        if (args.photoSize) {
            switch (args.photoSize) {
            case 50:
                photo = "photo_50";
            case 100:
                photo = "photo_100";
                break;
            case 200:
                photo = "photo_200";
                break;
            }
        }
        
        fields = this.addFieldValue(fields, photo);
        
        VK.api('users.get', {
            fields : fields
        }, function(r) {
            if (r.response) {
                var name = r.response[0].first_name + " "
                        + r.response[0].last_name;
                var myInfo = {
                    name : name,
                };
                var picture = r.response[0][photo];
                if (picture)
                    myInfo.picture = picture;
                myInfo.id = r.response[0].uid;
                callback(myInfo);
            } else {
                callback({
                    error : 'error'
                });
            }
        });
    },

    getFriendsInfoInternal : function() {
        var callback = this.friendsCallback;
        var args = this.args;
        var fields = '';
        
        var photo = "photo_100"; // default
        if (args.photoSize) {
            switch (args.photoSize) {
            case 50:
                photo = "photo_50";
            case 100:
                photo = "photo_100";
                break;
            case 200:
                photo = "photo_200";
                break;
            }
        }
        
        fields = this.addFieldValue(fields, photo);
        
        VK.api('friends.get', {
            fields : fields
        }, function(r) {
            if (r.response) {
                var allFriends = r.response;
                var friendsList = [];
                for (var i = 0; i < allFriends.length; i++) {
                    friendsList[i] = {
                        name : allFriends[i].first_name + ' '
                                + allFriends[i].last_name,
                        picture : allFriends[i][photo],
                        id : allFriends[i].uid
                    };
                }
                callback({ data : friendsList });
            } else {
                callback({
                    error : 'error'
                });
            }
        });
    },
    
    postOnWall : function(args, callback) {
        var postResponse = {};
        
        VK.api('wall.post', {
            message : args.message,
            attachments : args.attachments
        }, function(r) {
            if (r.response) {
                postResponse.success = true;
            } else {
                postResponse.success = false;
            }
            callback(postResponse);
        });
    },
   
    addAchievement : function(achievement, callback) {
        var myResponse = {};
        var count = "0";
        VK.api('storage.get', 
            { key : "count" },
            function(r) {
                if (!r.error) {
                    if (r.response) {
                        count = r.response;
                    }
                    VK.api('storage.set',
                        { key : "achievement" + count,
                          value : achievement },
                        function(r) {
                            if (r.response == 1) {
                                VK.api('storage.set',
                                        { key : "count",
                                          value : parseInt(count) + 1 },
                                        function(r) {
                                            if (r.response == 1) {
                                                myResponse.success = true;
                                                myResponse.id = "achievement" + count;
                                            } else {
                                                myResponse.success = false;
                                            }
                                            callback(myResponse);
                                        }
                                 );
                            } else {
                                myResponse.success = false;
                            }
                        }
                     );
                } else {
                    myResponse.success = false;
                    callback(myResponse);
                }
        });
    },
    
    getAchievements : function(callback) {
        var myResponse = {
            data : []
        };
        var vkPrototype = this;
        VK.api('storage.getKeys', {},
            function(r){
                if (r.response && r.response.length > 0){
                    var count = 0;
                    var i = 0;
                    r.response.forEach(function(storageKey) {
                        vkPrototype.getAchievement(storageKey,
                            function(response){
                                if (response.success && response.data){
                                    myResponse.data[count] = response.data;
                                    count++;
                                }
                                if (i + 1 == r.response.length) {
                                    myResponse.count = count;
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
    
    getAchievement : function(achievement, callback) {
        var myResponse = {};
        if (achievement.indexOf("achievement") != -1){
            VK.api('storage.get', 
            { key : achievement },
            function(r) {
                if (r.response) {
                    myResponse.success = true;
                    var ifrme = document.createElement("IFRAME");
                    ifrme.setAttribute("id", achievement); 
                    ifrme.style.display = 'none';
                    document.body.appendChild(ifrme);
                    document.getElementById(achievement).onload =  
                        function(){
                            var ifrm = document.getElementById(achievement);
                            var atchievementDoc = ifrm.contentWindow.document;
                            var metaTags = atchievementDoc.getElementsByTagName("META");
                            var data = {
                                title : metaTags[1].content,
                                url : metaTags[2].content,
                                description : metaTags[3].content,
                                image : metaTags[4].content,
                                points : metaTags[5].content,
                                id : achievement
                            };
                            myResponse.data = data;
                            ifrm.remove();
                            callback(myResponse);
                    };
                    document.getElementById(achievement);
                    document.getElementById(achievement).src = r.response;
                }
             }
            );
        } else {
            myResponse.success = false;
            callback(myResponse);
        }
    },
    
    postAchievement : function(achievement, callback) {
        var vkPrototype = this;
        this.getAchievements(
                function(response){
                    if (response.data){
                        var needToAdd = true;
                        for(var i = 0; i < response.data.length; i++){
                            if(response.data[i].url == achievement) {
                                needToAdd = false;
                                break;
                            }
                        }
                        if(needToAdd){
                            vkPrototype.addAchievement(achievement,
                                function(response){
                                    if (response.success){
                                        vkPrototype.getAchievement(response.id,
                                            function(response){
                                                if (response.success){
                                                    var args = {
                                                        attachments : response.data.image,
                                                        message : response.data.title + "\n" + response.data.description
                                                    };
                                                    vkPrototype.postOnWall(args, callback);
                                                } else {
                                                    var response = {
                                                            success : false
                                                        };
                                                        callback(response);
                                                }
                                        });
                                    } else {
                                        var response = {
                                            success : false
                                        };
                                        callback(response);
                                    }
                                });
                        } else {
                            var response = {
                                success : false
                            };
                            callback(response);
                        }
                    }    
            });
    },
    
    deleteAchievement : function(achievement, callback){
        var myResponse = {};
        this.getAchievements(
                function(response){
                    if (response.data && response.data.length > 0){
                        for(var i = 0; i < response.data.length; i++){
                            if(response.data[i].url == achievement) {
                                myResponse.success = false;
                                VK.api('storage.set',
                                    { key : response.data[i].id,
                                      value : "" },
                                    function(r) {
                                        if (r.response == 1) {
                                            myResponse.success = true;
                                        }
                                        callback(myResponse);
                                    });
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
                });
    },
    
    getHighScores : function(callback){
        var myResponse = {
            data : []
        };
        VK.api('getHighScores', {}, 
                function(r) {
                    if (r.response && r.response.length > 0) {
                        for (var i = 0; i < r.response.length; i++) {
                            var data = {};
                            data.id = r.response[i].user_id;
                            data.name = r.response[i].user_name;
                            data.score = r.response[i].score;
                            myResponse.data[i] = data;
                        }
                    } 
                    callback(myResponse);
                });
    },
    
    setScore : function(score, callback){
        var myResponse = {};
        VK.api('setUserScore', 
                { score : score },
                function(r) {
                    if (r.response) {
                        myResponse.success = true;
                    } else {
                        myResponse.success = false;
                    }
                    callback(myResponse);
                });
    },
    
    inviteFriends : function() {
        VK.callMethod("showInviteBox");
    }
    
    
};