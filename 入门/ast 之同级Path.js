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

const js_code = fs.readFileSync("C:\\Users\\Yang\\WebstormProjects\\ast_study\\demo\\demo1.js", {
    encoding: "utf-8"
});
let ast = parser.parse(js_code);

// 在这里对AST进行一系列的操作
// a. path.inList: 用于判断是否有同级节点。注意 当container为数组但是只有一个成员时也会返回true
// b. path.container: 获取容器(包含所有同级节点的数组)
// c. path.key: 获取当前节点在容器中的索引
// d. path.listKey: 获取容器名
// e. path.getSibling(index): 用于获取同级path 其中的index即为容器数组中的索引 index可以通过path.key来获取 可以对path.key进行加减操作
// 来定位到不同的同级path

const visitor = {
    ReturnStatement(path){
        console.log(path.inList());
        console.log(path.container);
        console.log(path.listKey);
        console.log(path.key);
        console.log(path.getSibling(path.key));
    }
}

// f. unshiftContainer与pushContainer: unshiftContainer是头部加入一个容器中 pushContainer是尾部加入一个容器中
const visitor1 = {
    ReturnStatement(path) {
        path.parentPath.unshiftContainer('body', [
            // t.expressionStatement 是生成一个引号(;)
            t.expressionStatement(t.stringLiteral('Before1')),
            t.expressionStatement(t.stringLiteral('Before2'))]);

        console.log(path.parentPath.pushContainer('body', [
            t.expressionStatement(t.stringLiteral('After'))]));
    }
}

traverse(ast, visitor1);

let code = generator(ast).code;
fs.writeFile('.demoNew.js', code, (err)=>{});
