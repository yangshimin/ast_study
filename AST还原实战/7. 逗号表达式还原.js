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

const js_code = fs.readFileSync("C:\\Users\\Yang\\WebstormProjects\\ast_study\\demo\\逗号表达式还原的demo.js", {
    encoding: "utf-8"
});
let ast = parser.parse(js_code);


// 逗号表达式还原: 逗号表达式在AST混淆中类型为SequenceExpression 其中expressions节点就是逗号运算符连接的每一个表达式
// expressions数组中的最后一个成员 就是逗号表达式返回的结果

traverse(ast, {
    SequenceExpression: {
        // 因为可能存在嵌套的情况 所以我们在遍历退出的时候进行判断
        exit(path){
            let expressions = path.node.expressions;
            // 从expressions数组尾部弹出最后一个表达式
            let finalExpression = expressions.pop();
            // 寻找最近的一个父级的statement语句
            let statement = path.getStatementParent();
            // 把此时expressions数组中的path放到 statement语句前面
            expressions.map(function (v){
                statement.insertBefore(t.expressionStatement(v));
            });
            // 用刚刚取出的最后一个表达式替换sequenceExpression
            path.replaceInline(finalExpression);
        }
    }
});



let code = generator(ast).code;
console.log(code);
// fs.writeFile('./demo/demo字符串解密以及去除数组混淆.js', code, (err)=>{});
