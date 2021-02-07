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

// ast type组件生成节点
let a = t.identifier('a');
let b = t.identifier('b');
let binExpr2 = t.binaryExpression("+", a, b);
let binExpr3 = t.binaryExpression("+", a, b);

let retSta2 = t.returnStatement(t.binaryExpression("+", binExpr2, t.numericLiteral(1000)));
let retSta3 = t.returnStatement(t.binaryExpression("+", binExpr3, t.numericLiteral(1000)));

let bloSta2 = t.blockStatement([retSta2]);
let bloSta3 = t.blockStatement([retSta3]);
let funcExpr2 = t.functionExpression(null, [a, b], bloSta2);
let funcExpr3 = t.functionExpression(null, [a, b], bloSta3);

let objProp1 = t.objectProperty(t.identifier('name'), t.stringLiteral("xiaojianbang"));
let objProp2 = t.objectProperty(t.identifier('add'), funcExpr2);
let objProp3 = t.objectProperty(t.identifier('mul'), funcExpr3);

let objExpr = t.objectExpression([objProp1, objProp2, objProp3]);
let varDec = t.variableDeclarator(t.identifier('obj'), objExpr);
let localAst = t.variableDeclaration('let', [varDec]);

let code = generator(localAst).code;
console.log(code);
