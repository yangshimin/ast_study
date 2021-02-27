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

// switch 流程平坦化: 打乱执行顺序
// 因为采用的是一行语句对应一条case的方案 所以需要先获取到每一行语句 处理方法与之前介绍的代码逐行混淆一致 遍历FunctionExpression 节点
// 获取path.node.body即BlockStatement 该节点的body属性是一个数组 通过map方法遍历数组 即可操作其中的每一行语句
/*
traverse(ast, {
    FunctionExpression(path){
        let blockStatement = path.node.body;
        let Statements = blockStatement.body.map(function(v, i){
            return {index: i, value: v};
        })
    }
})
*/

// 在流程平坦化的混淆中 要打乱原先的语句顺序 但是在执行的时候又要按原先的顺序执行 因为在打乱语句顺序之前 先要对原先的语句顺序做一哈映射
// 从上述代码中可以看出 采用的是{index: i, value: v}这种方法来做映射 index是语句在blockStatement.body中的所以 也就是原先的顺序
// value就是语句本身 有了这一一对应的关系后 就可以方便地建立分发器 来控制代码在执行时跳转到正确的case语句块

// 接着就要打乱语句顺序 算法也很简单 就是遍历数组每一个成员 每一次循环随机取出一个索引为j的成员与索引为i的成员进行交互
/*
let i = Statements.length;
while(i){
    let j = Math.floor(Math.random() * i--);
    [Statements[j], Statements[i]] = [Statements[i], Statements[j]];
}
*/

// 接着构建case语句块 在AST中的类型为SwitchCase 来了解下SwitchCase的结构
/*
{
    "type": "SwitchCase",
    "test": {"type": "NumericLiteral", "value": 5},
    "consequent": [
        Node {...},
        {"type": "ContinueStatement", "label": null}
    ]
}
*/
// test 就是case后面跟的值 consequent是一个数组 里面放的是case语句块中具体的语句 所以case快的生成很容易 遍历打乱顺序以后的语句数组Statements
// SwitchCase中的test 就用从0开始递增的NumericLiteral就可以 SwitchCase中的consequent 放两条语句 除了源代码中语句外 还有一条continue
// 语句 最后把包装好的SwitchCase 放如cases数组中
/*
let cases = [];
Statements.map(function(v, i){
    let switchCase = t.switchCase(t.numericLiteral(i), [v.value, t.continueStatement()]);
    cases.push(switchCase);
})
*/

// 为了控制switch每次都跳转到的case语句块上 需要着手构建分发器 分发器中的"0|1|4|5|3|2"来源于之前的映射 调整上面用来生成case语句块的代码
/*
let dispenserArr = [];
let cases = [];
Statements.map(function(v, i){
    dispenserArr[v.index] = i;
    let switchCase = t.switchCase(t.numericLiteral(i), [v.value, t.continueStatement()]);
    cases.push(switchCase);
})
let dispenserStr = dispenserArr.join("|");
*/
// 又定义了一个数组 dispenserArr 并且该数组在最后使用join方法以作为连接符连接数组所有成员 可以看出dispenserStr就是分发器"0|1|4|5|3|2"
// 而014532就是代码执行的真是顺序 因此dispenserArr中的成员应当是case后面的值 假设case后面的值是5 也就是这里的i = 5 取出当前语句的真是索引
// v.index 假设是3 也就是源代码中该语句是第4行语句(数组从0开始) 那么就把dispenserArr中索引为3的成员 改为case后面的值 也就是5 对应上述代码中的
// dispenserArr[v.index] = i 即可生成分发器中的那串字符串




let code = generator(ast).code;
// fs.writeFile('./AST之babel常用api/demoNew.js', code, (err)=>{});
