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

const js_code = fs.readFileSync("E:\\个人\\ast_study\\demo\\标识符详解案例.js", {
    encoding: "utf-8"
});
let ast = parser.parse(js_code);

// scope 详解
// scope 提供了一些属性和方法 可以方便查找标识符的作用域 获取标识符的所有引用 修改标识符的所有引用 以及知道标识符是否参数
// 标识符是否为常量 如果不是常量 可以知道在哪里修改了它

// 1. 获取标识符作用域
// scope.block 属性可以用来获取标识符作用域 返回的是Node对象 使用方法分为两种情况 变量和函数

// 1.0 打印当前作用域
visitor0 = {
    FunctionDeclaration(path){
        // 打印当前当前path的作用域
        console.log(path.scope.dump());

        // 获取作用域中a的绑定 然后打印其所属的js代码
        let a_binding = path.scope.getBinding('a');
        console.log(generator(a_binding.scope.block).code);

        // 获取作用域中aaa的绑定 然后打印其所属的js代码
        let aaa_binding = path.scope.getBinding('aaa');
        console.log(generator(aaa_binding.scope.block).code);
    }
}

// 1.1 标识符为变量的情况
visitor1 = {
    Identifier(path){
        // 变量 e 是定义在add函数内部的 作用域范围是整个add函数
        if (path.node.name == 'e') {
            console.log(generator(path.scope.block).code);
        }
    }
};

// 1.2  标识符为函数的情况
visitor2 = {
    FunctionDeclaration(path){
        // console.log(generator(path.scope.block).code);

        // 上述代码遍历FunctionDeclaration 在原代码中只有demo函数符合要求 但是demo函数的作用域实际上应该是整个add函数的范围
        // 但是输出的却是demo函数本身 因此输出与实际的不符 这时需要去获取父级作用域

        // path.scope.parent.block: 获取父级作用域
        console.log(generator(path.scope.parent.block).code);
    }
};

// 1.3 scope.getBinding()
// scope.getBinding 方法接收一个类型为string参数 用来在当前节点下能够获取的对应标识符的绑定
visitor3 = {
    // 遍历FunctionDeclaration 符合要求的只有demo函数 然后获取当前节点下的绑定a 直接输出binding
    FunctionDeclaration(path) {
        let binding = path.scope.getBinding('aaa');
        // console.log(path + "");
        // console.log(generator(binding.scope.block).code);
        // console.log(binding.constantViolations[0] + '')
        console.log(binding);
    }
};

// 介绍下Binding 中几个关键的属性 identifier 是 a 标识符的Node对象 path 是a标识符的path对象 kind中表明了这是一个参数
// 但是它并不代表就是当前demo函数的参数  在实际的源代码中 a 是add函数的参数 referenced表示当前标识符是否被引用
// references 表示当前标识符被引用的次数 constant 表示是否常量  referencePaths 存放所有引用该标识符的节点的path对象
// constantViolations 表示加入标识符有被修改 constantViolations中会存放所有修改该标识符节点的Path对象
/*
Binding {
    identifier: Node {
        type: 'Identifier',
            start: 91,
            end: 92,
            loc: SourceLocation {
            start: [Position],
                end: [Position],
                filename: undefined,
                identifierName: 'a'
        },
        range: undefined,
            leadingComments: undefined,
            trailingComments: undefined,
            innerComments: undefined,
            extra: undefined,
            name: 'a'
    },
    scope: Scope {
        uid: 1,
            path: NodePath {
            contexts: [Array],
                state: undefined,
                opts: [Object],
                _traverseFlags: 0,
                skipKeys: null,
                parentPath: [NodePath],
                container: [Node],
                listKey: undefined,
                key: 'value',
                node: [Node],
                type: 'FunctionExpression',
                parent: [Node],
                hub: undefined,
                data: null,
                context: [TraversalContext],
                scope: [Circular]
        },
        block: Node {
            type: 'FunctionExpression',
                start: 81,
                end: 286,
                loc: [SourceLocation],
                range: undefined,
                leadingComments: undefined,
                trailingComments: undefined,
                innerComments: undefined,
                extra: undefined,
                id: null,
                generator: false,
                async: false,
                params: [Array],
                body: [Node]
        },
        labels: Map {},
        inited: true,
            bindings: [Object: null prototype] {
            a: [Circular],
                demo: [Binding],
                e: [Binding]
        },
        references: [Object: null prototype] {},
        globals: [Object: null prototype] {},
        uids: [Object: null prototype] {},
        data: [Object: null prototype] {},
        crawling: undefined
    },
    path: NodePath {
        contexts: [],
            state: {
            references: [Array],
                constantViolations: [],
                assignments: [Array]
        },
        opts: {
            LabeledStatement: [Object],
                AssignmentExpression: [Object],
                UpdateExpression: [Object],
                UnaryExpression: [Object],
                CatchClause: [Object],
                ClassExpression: [Object],
                _exploded: true,
                _verified: true,
                Identifier: [Object],
                JSXIdentifier: [Object],
                enter: [Array],
                ForInStatement: [Object],
                ForStatement: [Object],
                ForOfStatement: [Object],
                FunctionDeclaration: [Object],
                VariableDeclaration: [Object],
                ClassDeclaration: [Object],
                ExportAllDeclaration: [Object],
                ExportDefaultDeclaration: [Object],
                ExportNamedDeclaration: [Object],
                ImportDeclaration: [Object],
                DeclareClass: [Object],
                DeclareFunction: [Object],
                DeclareInterface: [Object],
                DeclareModule: [Object],
                DeclareModuleExports: [Object],
                DeclareTypeAlias: [Object],
                DeclareOpaqueType: [Object],
                DeclareVariable: [Object],
                DeclareExportDeclaration: [Object],
                DeclareExportAllDeclaration: [Object],
                InterfaceDeclaration: [Object],
                OpaqueType: [Object],
                TypeAlias: [Object],
                EnumDeclaration: [Object],
                TSDeclareFunction: [Object],
                TSInterfaceDeclaration: [Object],
                TSTypeAliasDeclaration: [Object],
                TSEnumDeclaration: [Object],
                TSModuleDeclaration: [Object],
                BlockStatement: [Object],
                Program: [Object],
                TSModuleBlock: [Object],
                FunctionExpression: [Object],
                ObjectMethod: [Object],
                ArrowFunctionExpression: [Object],
                ClassMethod: [Object],
                ClassPrivateMethod: [Object]
        },
        _traverseFlags: 0,
            skipKeys: null,
            parentPath: NodePath {
            contexts: [Array],
                state: undefined,
                opts: [Object],
                _traverseFlags: 0,
                skipKeys: null,
                parentPath: [NodePath],
                container: [Node],
                listKey: undefined,
                key: 'value',
                node: [Node],
                type: 'FunctionExpression',
                parent: [Node],
                hub: undefined,
                data: null,
                context: [TraversalContext],
                scope: [Scope]
        },
        container: [ [Node] ],
            listKey: 'params',
            key: 0,
            node: Node {
            type: 'Identifier',
                start: 91,
                end: 92,
                loc: [SourceLocation],
                range: undefined,
                leadingComments: undefined,
                trailingComments: undefined,
                innerComments: undefined,
                extra: undefined,
                name: 'a'
        },
        type: 'Identifier',
            parent: Node {
            type: 'FunctionExpression',
                start: 81,
                end: 286,
                loc: [SourceLocation],
                range: undefined,
                leadingComments: undefined,
                trailingComments: undefined,
                innerComments: undefined,
                extra: undefined,
                id: null,
                generator: false,
                async: false,
                params: [Array],
                body: [Node]
        },
        hub: undefined,
            data: null,
            context: TraversalContext {
            queue: null,
                priorityQueue: [],
                parentPath: [NodePath],
                scope: [Scope],
                state: [Object],
                opts: [Object]
        },
        scope: Scope {
            uid: 1,
                path: [NodePath],
                block: [Node],
                labels: Map {},
            inited: true,
                bindings: [Object: null prototype],
            references: [Object: null prototype] {},
            globals: [Object: null prototype] {},
            uids: [Object: null prototype] {},
            data: [Object: null prototype] {},
            crawling: undefined
        }
    },
    kind: 'param',
    constantViolations: [
    NodePath {
        contexts: [],
        state: undefined,
        opts: [Object],
        _traverseFlags: 0,
        skipKeys: null,
        parentPath: [NodePath],
        container: [Node],
        listKey: undefined,
        key: 'expression',
        node: [Node],
        type: 'AssignmentExpression',
        parent: [Node],
        hub: undefined,
        data: null,
        context: [TraversalContext],
        scope: [Scope]
    }
],
    constant: false,
    referencePaths: [
    NodePath {
        contexts: [],
        state: [Object],
        opts: [Object],
        _traverseFlags: 0,
        skipKeys: null,
        parentPath: [NodePath],
        container: [Node],
        listKey: undefined,
        key: 'left',
        node: [Node],
        type: 'Identifier',
        parent: [Node],
        hub: undefined,
        data: null,
        context: [TraversalContext],
        scope: [Scope]
    },
    NodePath {
        contexts: [],
        state: [Object],
        opts: [Object],
        _traverseFlags: 0,
        skipKeys: null,
        parentPath: [NodePath],
        container: [Node],
        listKey: undefined,
        key: 'right',
        node: [Node],
        type: 'Identifier',
        parent: [Node],
        hub: undefined,
        data: null,
        context: [TraversalContext],
        scope: [Scope]
    }
],
    referenced: true,
    references: 2,
    hasDeoptedValue: false,
    hasValue: false,
    value: null
}
*/


// 1.4 遍历作用域
// scope.traverse方法可以用来遍历作用域中的节点 可以使用Path对象中的scope 也可以使用Binding中的scope 推荐使用后者
visitor4 = {
    FunctionDeclaration(path) {
        let binding = path.scope.getBinding('a');
        // 源代码中有a = 400 下面代码的作用是将它改为a = 500
        // 获取demo函数中的a的binding 然后遍历binding.scope.block(也就是a的作用域) 找到赋值表达式left为a的 将对应的right改掉即可
        binding.scope.traverse(binding.scope.block, {
            // AssignmentExpression: 赋值表达式
            AssignmentExpression(p){
                if (p.node.left.name == 'a')
                    p.node.right = t.numericLiteral(500);
            }
        });
    }
}

// 1.5 标识符重命名
// 可以使用scope.rename方法将标识符进行重命名 这个方法会同时修改所有引用该标识符的地方 例如将add函数中d变量重命名为x
visitor5 = {
    FunctionExpression(path){
        let binding = path.scope.getBinding('b');
        binding.scope.rename('b', 'x');
    }
};

// 上述方法确实很方便 但是如果硬性地指定一个名字 有可能会与现有标识符冲突与 这时候可以使用scope.generateUidIdentifier方法
// 来生成一个标识符 生成的标识符不会与任何本地定义的标识符冲突
visitor6 = {
    FunctionExpression(path){
        path.scope.generateUidIdentifier("uid");
        // Node { type: "Identifier", name: "_uid"}
        path.scope.generateUidIdentifier("uid");
        // Node { type: "Identifier", name: "_uid2"}
    }
}

// 使用上面两个方法 可以实现一个简单的标识符混淆方案 缺点就是所有的地方都不会重名了
visitor7 = {
    Identifier(path){
        path.scope.rename(
            path.node.name,
            path.scope.generateUidIdentifier('_0x2ba6ea').name
        );
    }
}


// 1.6 scope的其他方法
// scope.hasBinding('a'): 查询是否有标识符a的绑定 返回true或false 可以用scope.getBinding('a') 代替 scope.getBinding('a')返回undefined的时候 等同scope.hasBinding('a')返回false
// scope.hasOwnBinding('a'): 查询是否有自己的绑定 返回true或false 例如 对于demo函数来说 OwnBinding只有一个d 函数名demo虽然也是标识符 但不属于demo函数的OwnBinding范畴 是属于它的父级作用域的
// 同样可以使用scope.getOwnBinding('a')代替它 scope.getOwnBinding('a')返回undefined的时候 等同于scope.hasOwnBinding('a')返回false

// scope.getAllBindings(): 获取当前节点的所有绑定 会返回一个对象 该对象以标识符名为属性名 对应的Binding为属性值
// scope.hasReference('a'): 查询当前节点中是否有a标识符的引用 返回true或false
// scope.getBindingIdentifier('a'): 获取当前节点中绑定的a标识符 返回的是Identifier的Node对象 同样地 这个方法也有Own版本 scope.getOwnBindingIdentifier('a')


traverse(ast, visitor3)
let code = generator(ast).code;
console.log(code);
// fs.writeFile('./AST之babel常用api/demoNew.js', code, (err)=>{});
