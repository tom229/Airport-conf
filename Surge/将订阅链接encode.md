encode链接： https://www.urlencoder.org

为什么要encode？ 1.是因为当字符串数据以url的形式传递给web服务器时,字符串中是不允许出现空格和特殊字符的。
2.因为 url 对字符有限制，比如把一个邮箱放入 url，就需要使用 urlencode 函数，因为 url 中不能包含 @ 字符。
3.url转义其实也只是为了符合url的规范而已。因为在标准的url规范中中文和很多的字符是不允许出现在url中的
