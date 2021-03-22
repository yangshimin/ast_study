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

const js_code = fs.readFileSync("C:\\Users\\Yang\\WebstormProjects\\ast_study\\demo\\数值常量加密的demo.js", {
    encoding: "utf-8"
});
let ast = parser.parse(js_code);

// 数值常量加密: 3872 ^ 432
// 遍历BinaryExpression 节点 取出left和right 当left几点和right节点类型都为NumericLiteral的时候 才是要还原的几点
// 接着调用path.evaluate()来计算节点的值 最终构造新的节点替换回去即可
traverse(ast, {
    BinaryExpression(path) {
        let left = path.node.left;
        let right = path.node.right;
        if (t.isNumericLiteral(left) && t.isNumericLiteral(right)) {
            // path.evaluate(): 计算二项式的值 返回两个值 第一个值是个布尔值代表能否计算 第二个值则是在能计算的情况下的计算结果
            // 需要注意的地方: 在计算的时候 如果二项式两边的值如果在某个地方有过修改 则不能计算
            let {confident, value} = path.evaluate();
            confident && path.replaceWith(t.valueToNode(value));
        }
    }
});


// 删除一些没用的代码

// 如果在删除没用的代码前AST有过替换或更新之类的操作 则需要生成最新的AST结构
let new_code = generator(ast).code;
let new_ast = parser.parse(new_code);

traverse(new_ast, {
    Identifier(path) {
        let binding = path.scope.getBinding(path.node.name);
        // constant 表示是否常量 constantViolations 表示加入标识符有被修改 constantViolations中会存放所有修改该标识符节点的Path对象
        binding && binding.constant && (binding.constantViolations.length === 0) &&
            path.parentPath.remove()
    }
});


let code = generator(ast).code;
console.log(code);
// fs.writeFile('./demo/demo字符串解密以及去除数组混淆.js', code, (err)=>{});
