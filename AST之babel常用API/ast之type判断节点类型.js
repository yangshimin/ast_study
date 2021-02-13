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

// AST types 组件主要用来判断节点类型，生成新的节点等;
 
// 判断节点类型
// 下面的代码因为enter没有指定节点类型, 所以是指进入任何一个节点都会进行if部分的操作
traverse(ast, {
    enter(path) {
        // 如果节点的类型是Identifier并且node.name为a就把节点的名字重名为x
        if (
            path.node.type === "Identifier" &&
            path.node.name === "a"
        ){
            path.node.name = "x";
        }
    }
});

// 上面的代码用types组件可以更简单的写为下面的方式
traverse(ast, {
    enter(path) {
        // 如果节点的类型是Identifier并且node.name为a就把节点的名字重名为x
        if (
            t.isIdentifier(path.node, {"name": 'a'})
            // 也等同于下面这种方式
            // path.isIdentifier({"name": 'a'})
        ){
            path.node.name = "x";
        }
    }
});

traverse(ast, visitor);

let code = generator(ast).code;
console.log(code);
// fs.writeFile('./AST之babel常用API/new_demo.js', code, (err)=>{});
