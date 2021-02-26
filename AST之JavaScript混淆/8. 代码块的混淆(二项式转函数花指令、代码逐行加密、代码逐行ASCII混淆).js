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

// 代码块的混淆: 二项式函数转花指令、代码逐行加密、代码逐行ASCII混淆  其中代码逐行加密、代码逐行ASCII混淆都要在标识符混淆之后
// 所以 在做标识符混淆的时候 应该把源代码中的eval 和 Function 处理一下才可以

// 1.1 二项式函数花指令 花指令用来尽可能地隐藏原代码的真实意图 如下所示 增加代码的阅读难度
/*
function xxx(a, b){
    return a + b;
}
xxx(c, d);

function xxxx(a, b){
    return a(b);
}
xxxx(a, b);
*/

// 二项式函数花指令的实现方式
// a. 遍历BinaryExpression 节点 取出 operator left right
// b. 生成一个函数 函数名要与当前节点中的标识符不冲突 参数可以固定为a和b 返回语句中的运算符与operator一致
// c. 找到最近的BlockStatement 节点 将生成的函数加入到body数组中的最前面
// d. 把原先的BinaryExpression 节点替换为 CallExpression callee 就是函数名 _arguments就是二项式的left和right

visitor1 = {
    BinaryExpression(path) {
        let operator = path.node.operator;
        let left = path.node.left;
        let right = path.node.right;
        let a = t.identifier('a')
        let b = t.identifier('b');
        // 生成唯一ID 避免与当前作用域下已有的函数同名
        let funcNameIdentifier  = path.scope.generateUidIdentifier('xxx');
        let func = t.functionDeclaration(
            funcNameIdentifier,
            [a, b],
            t.blockStatement([t.returnStatement(t.binaryExpression(operator, a, b))])
        );
        // 把生成的函数添加到最近的BlockStatement处
        let BlockStatement = path.findParent(function (p) {
            return p.isBlockStatement()
        });
        BlockStatement.node.body.unshift(func);
        // 替换原有的二项式为生成的函数调用
        path.replaceWith(t.callExpression(funcNameIdentifier, [left, right]));
    }
};

// 1.2 代码的逐行加密
// 这种方案的原理其实跟字符串加密是一样的 只不过需要先把代码转化为字符串 再 把字符串加密后的密文 传入字符串加密后的密文 传入
// 解密函数解出铭文 然后通过eval执行代码 但是这种加密没法大规模运行 否则加密比较明显 我们可以只加密核心语句 但是在运行的过程
// 中我们是无法感知到哪些是核心语句 所以需要一个标记 这个标记可以是特定的注释之类 这里以有注释并且为Base64Encrypt的 就进行加密
visitor2 = {
    FunctionExpression(path){
        // 获取函数体的主体
        let blockStatement = path.node.body;
        let Statements = blockStatement.body.map(function (v) {
            if (t.isReturnStatement(v)) return v;
            // 如果没有注释或这注释语句不为Base64Encrypt的语句就进行不加密
            if (!(v.trailingComments && v.trailingComments[0].value == 'Base64Encrypt')) return v;
            // 删除掉注释 delete 可以删除对象属性  这里之所以不用remove是因为我们当前得到的是一个node对象 而remove是针对path对象的
            delete v.trailingComments
            let code = generator(v).code;
            // 将函数体内的非return语句加密成密文
            let cipherText = base64Encode(code);
            let decryptFunc = t.callExpression(t.identifier('atob'),
                [t.stringLiteral(cipherText)])
            // 因为解密函数解密过后还是一个字符串 所以还需要一个eval
            return t.expressionStatement(t.callExpression(t.identifier('eval'),
                [decryptFunc]));
        });
        // 这里不用path.node.body而用path.get("body") 是因为path.node.body返回的是一个node对象
        // path.get("body") 返回的是一个path对象 replaceWith是path对象才拥有的方法
        path.get('body').replaceWith(t.blockStatement(Statements));
    }
};

// 1.3 代码的逐行ASCII码混淆
// 这种方案的原理与代码的逐行加密差不多 只不过把字符串加密函数去掉了 换成charCodeAt转到ASCII码 解密函数转换成
// String.fromCharCode 最后都需要eval函数来执行字符串代码

visitor3 = {
    FunctionExpression(path) {
        let blockStatement = path.node.body;
        let Statements = blockStatement.body.map(function (v) {
            if (t.isReturnStatement(v)) return v;
            if (!(v.trailingComments && v.trailingComments[0].value == 'ASCIIEncrypt')) return v;
            // 删除掉注释 delete 可以删除对象属性  这里之所以不用remove是因为我们当前得到的是一个node对象 而remove是针对path对象的
            delete v.trailingComments
            let code = generator(v).code;
            let codeAscii = [].map.call(code, function (v) {
                return t.numericLiteral(v.charCodeAt(0));
            })
            let decryptFuncName = t.memberExpression(t.identifier('String'), t.identifier('fromCharCode'));
            let decryptFunc = t.callExpression(decryptFuncName, codeAscii);
            return t.expressionStatement(t.callExpression(t.identifier('eval'), [decryptFunc]));
        });
        path.get('body').replaceWith(t.blockStatement(Statements));
    }
}

traverse(ast, visitor1)
let code = generator(ast).code;
// fs.writeFile('./AST之babel常用api/demoNew.js', code, (err)=>{});
