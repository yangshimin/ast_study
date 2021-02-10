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

// 在这里对AST进行一系列的操作
// a.获取子节点/path
// 为了得到AST子节点的属性值 一般会先访问该节点 然后利用path.node.property方法获取属性
const visitor = {
    BinaryExpression(path) {
        console.log(path.node.left);
        console.log(path.node.right);
        console.log(pathh.node.operator);
    }
};

// 通过path.node.xxx获取到的是Node或具体的属性值 Node是用不了Path相关方法的 如果想要获取到该属性的Path
// 就需要使用Path对象的get方法，传递的参数为字符串形式的key 如果是多级访问 以点连接多个key
const visitor1 = {
    BinaryExpression(path) {
        console.log(path.get('left.name'));
        console.log(path.get('right'));
        console.log(path.get('operator'));
    }
};


// b.判断path类型
// path对象都有一个type属性 它基本与Node中的type一致 path对象提供相应的方法来判断自身类型 使用方法与types组件差不多
// 只不过types组件判断的是Node
const visitor2 = {
    BinaryExpression(path) {
        console.log(path.get('left').isIdentifier());
        console.log(path.get('right').isNumericLiteral({
            value: 1000
        }));
        path.get('operator').assertIdentifier();
    }
};


// c. 节点转代码
const visitor3 = {
    FunctionExpression(path) {
        // 以下三种都可以
        console.log(generator(path.node).code);
        // console.log(path.toString());
        // console.log(path + "");
    }
}


// d.替换节点属性
// 替换节点属性与获取节点属性相同 只是改为赋值 但也并非随意替换 需要注意替换的类型要在运行的范围内
const visitor4 = {
    FunctionExpression(path) {
        path.node.left = t.identifier("x");
        path.node.right = t.identifier("y");
    }
}


// e. 替换整个节点
// Path 对象中与替换相关的方法有replaceWith、replaceWithMultiple、replaceInline和replaceWithSourceString
// replaceWith: 节点替换节点 严格一换一
const visitor5 = {
    BinaryExpression(path) {
        path.replaceWith(t.valueToNode('xiaojianbang'));
    }
}

// replaceWithMultiple： 节点替换节点，只不过可以一换多 returnStatement 换成了三种
const visitor6 = {
    ReturnStatement(path){
        path.replaceWithMultiple([
            t.expressionStatement(t.stringLiteral("xiaojianbang")),
            t.expressionStatement(t.numericLiteral(1000)),
            t.returnStatement(),
        ]);
    }
}

// replaceInline: 该方法接收一个参数 如果参数不为数组 那么replaceInline等同于replaceWith 如果参数为数组
// replaceInline 等同于replaceWithMultiple 其中的数组成员必须都为节点
const visitor7 = {
    stringLiteral(path) {
        path.replaceInline(
            t.stringLiteral('HELLO AST'));
        path.stop();
    },

    ReturnStatement(path){
        path.replaceWithMultiple([
            t.expressionStatement(t.stringLiteral("xiaojianbang")),
            t.expressionStatement(t.numericLiteral(1000)),
            t.returnStatement(),
        ]);
        path.stop();
    }
}

// replaceWithSourceString: 该方法用字符串源码替换节点。例如要把原始代码中的函数改为闭包的形式
const visitor8 = {
    ReturnStatement(path){
        let argumentPath = path.get("argument");
        argumentPath.replaceWithSorceString(
            'function(){return ' + argumentPath.toString() + '}()'
        );
        path.stop();
    }
}

// f.删除节点
// 凡是修改节点的操作 都推荐使用Path对象的方法 因为当调用一个修改节点的操作后 Babel会更新path对象
const visitor9 = {
    // EmptyStatement指的是空语句 就是多余的分号 使用path.remove()删除当前节点
    EmptyStatement(path){
        path.remove();
    }
}

// g. 插入节点
// 想要把节点插入到兄弟节点中 可以使用insertBefore insertAfter分别在当前节点的前、后插入节点
const visitor10 = {
    ReturnStatement(path) {
        path.insertBefore(t.expressionStatement(t.stringLiteral("Before")));
        path.insertAfter(t.expressionStatement(t.stringLiteral('After')));
    }
}

traverse(ast, visitor);
let code = generator(ast).code;
fs.writeFile('./入门/demoNew.js', code, (err)=>{});
