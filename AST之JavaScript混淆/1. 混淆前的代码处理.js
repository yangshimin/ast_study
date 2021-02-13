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

const js_code = fs.readFileSync("C:\\Users\\Yang\\WebstormProjects\\ast_study\\demo\\demo2.js", {
    encoding: "utf-8"
});
let ast = parser.parse(js_code);

//a. 改变对象属性访问方式
// 对象属性方式有两种, 及类似console.log或者console["log"]。 在js混淆中 通常会使用console["log"]的对象属性的访问方式
const visitor = {
    MemberExpression(path){
        if (t.isIdentifier(path.node.property)){
            let name = path.node.property.name;
            path.node.property = t.stringLiteral(name);
        }
        // computed为真表示以中括号的形式访问 为假表示以点的形式去访问
        path.node.computed = true;
    },
}

// b. JavaScript 标准内置对象或全局函数的处理
// 内置对象或全局函数一般都是window下的属性 例如Date 可以转化为window["Date"]这种形式访问 这样的Date是一个字符串 因此可以进行混淆
// 这些内置对象或全局函数在AST中都是标识符 因此处理代码的过程可以是遍历Identifier节点 把符合要求的节点替换为window的MemberExpression
visitor2 = {
    Identifier(path) {
        let name = path.node.name;
        if ('eval|parseInt|encodeURIComponent|Object|Function|Boolean|Number|Math|Date|String|RegExp|Array'.indexOf("|" + name + "|") != -1){
            path.replaceWith(t.memberExpression(t.identifier('window'), t.stringLiteral(name), true));
        }
    }
}


traverse(ast, visitor2);

let code = generator(ast).code;
console.log(code);
// fs.writeFile('C:\\Users\\Yang\\WebstormProjects\\ast_study\\new_demo.js', code, (err)=>{});