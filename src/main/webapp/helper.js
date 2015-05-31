/* �vairios pagalbin�s funkcijos */

/* tik kad b�t� i�vengta "undeclared variable"*/
var FB; //  
var VK;

/*-- metodai, kurie prideda funkcij� � veiksm� eil�, arba j� vykdo i�kart, jei naudotojas prisijung�s */
function queueAddFB(f) {
    var fbPrototype = this;
    if (FB == undefined) {
        myQueue.push(f);
    } else {
        FB.getLoginStatus(function(response) {
            if (response.status === 'connected') {
                f.call(fbPrototype);
            }
        });
        myQueue.push(f);
    }
}

function queueAddVK(f) {
    var vkPrototype = this;
    if (VK == undefined) {
        myQueue.push(f);
    } else {
       f.call(vkPrototype);
    }
    myQueue.push(f);
}

/* veiksm� eil�s vykdymo funkcija */
var myQueue;
function processQueue() {
    var f;
    while (f = myQueue.shift())
        f.call(this);
}

/* ----- parametro i�traukimo i� url funkcija-------  */
function getUrlValue(variable){
    var searchString = window.location.search.substring(1);
    var variableArray = searchString.split('&');
    for(var i = 0; i < variableArray.length; i++){
        var keyValuePair = variableArray[i].split('=');
        if(keyValuePair[0] == variable){
            return keyValuePair[1];
        }
    }
}

function createApi(args, callback){
    var iApi = null;
    if ( args.socialNetwork == "facebook" ) {
        iApi = new Facebook();
    } else if (args.socialNetwork == "vkontakte"){
        iApi = new Vkontakte();
    }
    if (args.appId) iApi.setAppId(args.appId);
    if (args.apiVersion) iApi.setApiVersion(args.apiVersion);
    if (callback) {
        callback(iApi);
    } else {
        return iApi;
    }
}
