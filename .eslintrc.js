// - 4空格缩进
// - 未定义变量不允许使用
// - 不要以(, [, 或 `作为行首
// - if (condition) { ... }关键词后强制空格
// - 函数名后强制空格
// - 强制处理回调错误

module.exports = {
    "env": {
        "node": true,
        "mocha": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": [
            "error",
            4
        ],
        "no-console": [
            "error",
            {
                "allow": [
                    "log",
                    "warn",
                    "error"
                ]
            }
        ],
        "no-unused-vars": [
            "error",
            {
                "vars": "local",
                "args": "after-used",
                "varsIgnorePattern": "debug"
            }
        ],
        "block-spacing": "error",
        "no-unexpected-multiline": "error",
        "handle-callback-err": "error",
        "space-before-function-paren": ["error", {
            "anonymous": "always",
            "named": "always",
            "asyncArrow": "ignore"
        }],
        "keyword-spacing": ["error", {
            "before": true,
            "after": true
        }]
    }
}