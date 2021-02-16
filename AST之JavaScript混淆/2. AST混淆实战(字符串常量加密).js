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

const js_code = fs.readFileSync("F:\\code\\ast_study\\demo\\demo2.js", {
    encoding: "utf-8"
});
let ast = parser.parse(js_code);

// 字符串常量加密
// 代码中明文是"prototype", 加密后的值为"eHJvdG90eXB1", 解密函数为atob 只要生成一下atob("eHJvdG90eXB1) 然后用它替换原先的"prototype"
// 即可 当然解密函数也需要一起放入原始代码中 在这里就用Base64编码一下字符串 然后使用浏览器自带的atob来解密 在AST中操作的话 要先遍历所有的
// StringLiteral 取出其中的value属性进行加密 然后把StringLiteral节点替换为CallExpression(调用表达式)

// 简单自定义一个加密函数
function base64Encode(str) {
    let b = new Buffer.from(str);
    return b.toString('base64');
}

// 简单自定义一个解密函数
// 注意： 这个加密函数应该放在混淆后的代码中 如果不放 混淆后的代码是不能正常运行的
function baseDecode(str) {
    let b = new Buffer.from(str, 'base64');
    return b.toString("utf-8");

}

const visitor = {
    // 改变属性访问访问
    MemberExpression(path){
        if (t.isIdentifier(path.node.property)){
            let name = path.node.property.name;
            path.node.property = t.stringLiteral(name);
        }
        // computed为真表示以中括号的形式访问 为假表示以点的形式去访问
        path.node.computed = true;
    },
    // 内置函数或全局函数改变调用方式
    Identifier(path) {
        let name = path.node.name;
        if ('eval|parseInt|encodeURIComponent|Object|Function|Boolean|Number|Math|Date|String|RegExp|Array'.indexOf("|" + name + "|") != -1){
            path.replaceWith(t.memberExpression(t.identifier('window'), t.stringLiteral(name), true));
        }
    },
    // 字符串常量加密
    StringLiteral(path){
        // 生成callExpression 参数就是字符串加密后的密文
        let encStr = t.callExpression(
            t.identifier('baseDecode'),
            [t.stringLiteral(base64Encode(path.node.value))]
        );
        path.replaceWith(encStr);
        // 替换后的节点里也有StringLiteral节点 会造成死循环 因此需要加入path.skip()
        path.skip();
    }
}

traverse(ast, visitor);

let code = generator(ast).code;
console.log(code);
// fs.writeFile('C:\\Users\\Yang\\WebstormProjects\\ast_study\\new_demo.js', code, (err)=>{});