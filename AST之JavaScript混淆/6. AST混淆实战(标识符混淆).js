const fs = require('fs');
// 解析js,将js代码转换为AST
// parser的parse方法有第二个参数sourceType, 当js代码中含有import、export (es6的代码)等关键字时
// 需要指定sourceType为module
const parser = require("@babel/parser");
// 用来遍历AST中的节点
const traverse = require("@babel/traverse").default;
// 用来判断节点类型和生成新的节点等
const t = require("@babel/types");
// 用来把AST代码转换成JS代码
// generator 也有其他参数，具体参考文档: https://babeljs.io/docs/en/@babel-generator
const generator = require("@babel/generator").default;

const js_code = fs.readFileSync("F:\\code\\ast_study\\demo\\标识符重命名案例.js", {
    encoding: "utf-8"
});
let ast = parser.parse(js_code);

// 标识符混淆
// 实际开发中 可以让各个函数之间的局部标识符名相同 函数内的局部标识符名还可以与没有引用到的全局标识符名相同
// 实现这种方案需要用到一个方法 scope.getOwnBinding 该方法可以用来获取属于当前节点的自定的绑定 例如 在Program节点下 使用getOwnBinding
// 就可以获取到全局标识符名 而函数内部标识符名也会被获取到 那么要获取到局部标识符名 可以遍历函数节点 在FunctionExpression 与 FunctionDeclaration
// 节点下 使用getOwnBinding 会获取到函数自身定义的局部标识符名 而不会获取到全局标识符名

function renameOwnBinding(path){
    // globalBindingObj：不作处理的变量
    // OwnBindingObj: 要做处理的变量
    let OwnBindingObj = {}, globalBindingObj = {}, i = 0;
    // 打印当前节点的js代码
    // console.log(path + "");

    path.traverse({
        Identifier(p) {
            let name = p.node.name;
            // p.scope.getOwnBinding(name): 获取标识符名的绑定
            // 但有几个需要注意的地方： 一. 可以获取到子函数内部的标识符的绑定
            // 二. 以functionDeclaration方式定义函数获取到的绑定是underfined, 但是在调用的时候可以获取到绑定
            let binding = p.scope.getOwnBinding(name);
            // path + "": 通过隐式转换把AST转为js代码
            // binding.scope.block: 获取当前绑定的作用域
            // 当节点为Program或者有函数定义的有子函数时 p.scope.getOwnBinding(name) 也会获取到函数内部的绑定 这样获取的绑定就把和局部标志符名混合
            // 了 所以通过如下方式把绑定的作用域js代码和节点的js代码做比较是否一致来判断
            binding && generator(binding.scope.block).code == path + "" ?
                (OwnBindingObj[name] = binding) : (globalBindingObj[name] = 1);
        }
    });

    // 开始对存储的要重命名的标识符进行遍历
    for (let oldName in OwnBindingObj) {
        // 避免要重命名的标识符与不做处理的标志符名相同了
        do {
            var newName = '_02xba6ea' + i++;
        } while (globalBindingObj[newName]);

        // 重命名
        OwnBindingObj[oldName].scope.rename(oldName, newName);
    }
}

// 遍历三种节点 执行同一个重命名方法
traverse(ast, {
    'Program|FunctionExpression|FunctionDeclaration'(path) {
        renameOwnBinding(path);
    }
});


let code = generator(ast).code;
console.log(code);
// fs.writeFile('F:\\code\\ast_study\\demo\\new_demo.js', code, (err)=>{});