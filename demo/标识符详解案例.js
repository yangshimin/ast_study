const a = 1000;
let b = 2000;
var aaa = 1000;
let obj = {
    name: 'xiaojianbang',
    add: function (a) {
        a = 400;
        b = 300;
        let e = 700;
        function demo() {
            let d = 600;
        }
        demo();
        return a + a + b + 1000 + obj.name;
    }
};

obj.add(100);