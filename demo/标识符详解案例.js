let a = 1000;
let b = 2000;
var aaa = 1000;
let obj = {
    name: 'xiaojianbang',
    add: function (c) {
        a = 400;
        b = 300;
        ccc = 200;
        let e = 700;
        function demo() {
            let d = 600;
        }
        demo();
        return c + a + b + + ccc + 1000 + obj.name;
    }
};

obj.add(100);