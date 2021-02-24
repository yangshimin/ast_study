var b = 200;
var c = 300;

var abc = function () {
    var a = 1000;
};
abc();

// path.scope.getOwnBinding('bcd') 获取到的绑定为underfined
// 但在调用的时候可以获取到绑定
function bcd() {
    var a = 1000;
    var b = 500;
    function test(){
        var a = 200;
        var c = 200;
        var e = 5;
        return a + c + b;
    }
    test();
    return a + b + c;
}

bcd();