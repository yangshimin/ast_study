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

// 数值常量加密
// 代码中的数值常量可以通过遍历NumericLiteral节点 获取其中的value属性得到 然后随机生成一个数值记为key
// 接着把value与key进行异或得到加密后的数值几位cipherNum 即cipherNum = value ^ key 此时value = 即cipherNum ^ key
// 一次可以生成一个BinaryExpression 节点来等价的替换NumericalLiteral节点 BinaryExpression的operator为^ left 为cipherNum
// right 为key

visitor = {
    NumericLiteral(path){
        let value = path.node.value;
        let key = parseInt(Math.random() * (999999 - 100000) + 100000, 10);
        let cipherNum = value ^ key;
        path.replaceWith(t.binaryExpression('^', t.numericLiteral(cipherNum), t.numericLiteral(key)));
        // 替换后的节点里也有numericLiteral节点 会造成死循环 因此需要加入path.skip()
        path.skip();
    }
}


traverse(ast, visitor);

let code = generator(ast).code;
console.log(code);
// fs.writeFile('C:\\Users\\Yang\\WebstormProjects\\ast_study\\new_demo.js', code, (err)=>{});