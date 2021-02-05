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

const js_code = fs.readFileSync("F:\\code\\ast_study\\demo\\demo1.js", {
    encoding: "utf-8"
});
let ast = parser.parse(js_code);

// 定义visitor 这样在遍历节点的时候, 可以对节点做一些事情
// 当遍历到节点为FunctionExpression会自动调用以下函数
// 如果想要处理其他节点类型 例如Identifier 可以在visitor继续定义方法 以Identifier命名即可
const visitor = {
    FunctionExpression(path){
        console.log("xiaojianbang");
    },
    Identifier(path){
        console.log("xiaojianbang Identifier");
    }
};

traverse(ast, visitor);


let code = generator(ast).code;
console.log(code);
// fs.writeFile('./入门/new_demo.js', code, (err)=>{});
