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

// 定义visitor 这样在遍历节点的时候, 可以对节点做一些事情
// 当遍历到节点为FunctionExpression会自动调用以下函数
// 如果想要处理其他节点类型 例如Identifier 可以在visitor继续定义方法 以Identifier命名即可
/*
三种visitor写法：
const visitor1 = {
    FunctionExpression: function(path){
        console.log("xiaojianbang");
    }
}

const visitor2 = {
    FunctionExpression(path){
        console.log("xiaojianbang");
    }
}

第三种的enter表示在进入节点时要做的处理; exit表示在退出节点时要做的处理
babel在处理节点的时候采取的是深度优先; enter 和 exit 不必同时写, 可根据情况选择处理的时机
const visitor3 = {
    FunctionExpression: {
        enter(path) {
            console.log("xiaojianbang");
        },
        exit(path) {
            console.log("xiaojianbang");
        }
    }
}


*/

/*
同一个函数应用到多个节点
babel 还支持用一个函数同时处理多个节点, 用双引号包裹用 | 连接同时想处理的节点类型
const visitor = {
    "FunctionExpression|BinaryExpression"(path){
        console.log("xiaojianbang");
    }
};
*/

/*
多个函数应用到同一个节点
babel 也支持用多个函数处理同一个节点。原先是把一个函数赋值给enter或者exit, 现在改成函数的数组即可
function func1(path) {
    console.log('func1');
}

function func2(path) {
    console.log("func2");
}

const visitor = {
    FunctionExpression: {
        enter: [func1, func2]  // 先执行func1, 后执行func2;
    }
};
*/

/*
traverse 并非必须从头遍历, 可在任意节点向下遍历。例如, 想把代码中所有函数的第一个参数改为x
注意： 下面的例子是没有考虑到具体的作用域 只为讲解如何使用
const updateParamNameVisitor = {
    Identifier(path) {
        if (path.node.name) === this.paramName {
            path.node.name = "x";
        }
    }
}

const visitor = {
    FunctionExpression(path) {
        const paramName = path.node.param[0].name;
        // path.traverse 表示从FunctionExpression这个节点开始向下遍历
        // path.traverse 的第二个参数是一个对象{paramName}
        // 可以被 updateParamNameVisitor 引用到(此例中是this.paramName, this 指的就是前面的对象{paramName})
        path.traverse (updateParamNameVisitor, {
            paramName
        })
    }
}
*/
const visitor = {
    FunctionExpression(path){
        console.log("xiaojianbang");
    },
    Identifier(path){
        console.log("xiaojianbang Identifier");
    }
};

traverse(ast, visitor);


let code = generator(ast).code;
console.log(code);
// fs.writeFile('./AST之babel常用API/new_demo.js', code, (err)=>{});
