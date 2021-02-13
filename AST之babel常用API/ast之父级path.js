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

// parentPath 和parent的关系: path.parentPath.path 相当于path.parent 也就是说parent是parentPath的一部分

// path.findParent(): 个别情况下 需要从一个路径向上遍历语法树 直到满足相应的条件 这时候可以使用path对象的findParent方法
const visitor = {
    ReturnStatement(path){
        // console.log(path.findParent((p) -> p.isObjectExpression()));
        // path 对象的findParent方法接收一个回调函数, 向上遍历每一个父级path时, 会调用该回调函数, 并传入对应的父级path
        // 对象作为参数.当该回调函数返回真值时则将对应的父级path返回; 如果全部遍历完成都没有找到会返回null
        path.findParent(function (p){return p.isObjectExpression()});
    }
}


// path.find(): 使用方法与findParent一致 只不过path.find方法查找范围包括当前节点 而findParent不包含
const visitor2 = {
    ObjectExpression(path){
        console.log(path.find(function(p){return p.isObecjtExpression()}));
    }
}

// path.getFunctionParent(): 向上查找与当前节点最接近的父函数; 返回值也是Path对象

//path.getStatementParent(): 向上遍历语法树 直到找到语句父节点。例如, 声明语句 return语句 if语句 which语句 while语句等等
// 返回的也是Path对象 该方法从当前节点开始找起 如果想要找到return语句的父语句 就需要从parentPath中去调用
const visitor3 = {
    ReturnStatement(path) {
        console.log(path.parentPath.getStatementParent());
    }
}

traverse(ast, visitor);

let code = generator(ast).code;
fs.writeFile('./AST之babel常用API/demoNew.js', code, (err)=>{});
