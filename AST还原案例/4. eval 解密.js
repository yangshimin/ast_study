const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const generator = require("@babel/generator").default;
const template = require("@babel/template");
const fs = require("fs");

const jscode = fs.readFileSync('E:\\个人\\ast_study\\demo\\eval 解密案例.js', {
    encoding: "utf-8"
});
let ast = parser.parse(jscode);

// 参考自蔡老板的知识星球：https://t.zsxq.com/EyjAqjA  特此记录


const replaceEvalNode = {
    CallExpression:{
        exit:function(path)
        {
            let {callee,arguments} = path.node;
            if (arguments.length !== 1 ||
                !t.isLiteral(arguments[0]))  return;
            if (t.isIdentifier(callee, {name: "eval"}))
            {
                const evalNode = template.statements.ast(arguments[0].value);
                // replaceWithMultiple的参数是一个要进行替换的数组对象
                path.replaceWithMultiple(evalNode);
            }
        },
    }
}
traverse(ast, replaceEvalNode);

var js_code = generator(ast).code;
console.log(js_code);