/*
 * translater.js 1.0.5
 * Simple translation tools.
 * 
 * https://github.com/jaywcjlove/translater.js
 * Copyright 2016, kenny wang
 * Released under the MIT license.
*/
;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Translater = factory();
  }
}(this, function() {
var Translater = function(option,callback){
    // 默认给URL参数 ?lang=en
    option = option || {};
    if(getUrlParam("lang")){
        option.lang = getUrlParam("lang");  
    } 
    if(option.lang) {
        setCookie('t-lang',option.lang,24);
        this.lang_name = option.lang;
    }else{
        this.lang_name = "default";
    }
    // 回调函数
    this.callback = callback || function(){};
    this.langs = getElems() || [];
    if(this.lang_name !== 'default') this.setLang(option.lang);
    var lang = getCookie('t-lang');
    lang && lang !== 'default' && ( this.setLang(lang) );
}

Translater.prototype = {
    setLang:function(name){
        var langs = this.langs,method='';
        this.lang_name = name;
        for (var i = 0; i < langs.length; i++) {
            if(langs[i]['lang-'+name]){
                if(langs[i].element.tagName==='TITLE'){
                    method = 'innerHTML';
                }else if(langs[i].element.tagName==='IMG'){
                    method = 'src';
                }else{
                    method='nodeValue';
                }
                langs[i].element[method] = langs[i]['lang-'+name];
            }
        }
        setCookie('t-lang',name,24);
    },
    getLang:function() {
	   return this.lang_name;
    }
}

//获取 COOKIE
function getCookie(name){
    var nameEQ = name + "=";    
    var ca = document.cookie.split(';');//把cookie分割成组    
    for(var i=0;i < ca.length;i++) {    
        var c = ca[i];//取得字符串    
        while (c.charAt(0)==' ') {//判断一下字符串有没有前导空格    
            c = c.substring(1,c.length);//有的话，从第二位开始取    
        }    
        if (c.indexOf(nameEQ) == 0) {//如果含有我们要的name    
            return unescape(c.substring(nameEQ.length,c.length));//解码并截取我们要值    
        }    
    }    
    return false;
}

//设置 COOKIE
function setCookie(name, value, hours) {
    var date = new Date();
    date.setTime(date.getTime() + Number(hours) * 3600 * 1000);
    document.cookie = name 
        + "=" + value 
        + "; path=/;expires = " 
        + date.toGMTString();
}

// 获取所有节点里面的注释信息
// 返回一个数组
function getElems(){
    // var str = document.getElementById("box").innerHTML;
    // var str1 = str.replace(/<.*>(.*)<.*>/i,"$1"); 
    // var str2 = str.replace(/^.*<!--(.*)-->.*$/,"$1");
    var elems = Array.prototype.concat.apply(getTextNodes(document),getImgNodes(document));
    var emptyArray = [];
    var translateData = new Object();
    for (var i = 0; i < elems.length; i++) {
        elems[i].nodeValue = trim(elems[i].nodeValue)
        if(elems[i].nodeValue !== ''){
            translateData = translater(elems[i])

            if(Object.getOwnPropertyNames(translateData).length>2)
                emptyArray.push( translateData );
        };
    }
    return emptyArray;
}

// 处理title里面的语言切换情况
function serializeTitle(elm){
    var data = {},value = elm.nodeValue,i=0;
    data.element = elm.parentElement;
    data['lang-default'] = value.replace(/<!--(.*)-->.*/,"");
    value && (value = elm.nodeValue.match(/<!--\{\w+\}[\s\S]*?-->/gi) );
    if(value && value.length>0){
        for (; i < value.length; i++) {
            var name = value[i].match(/\{([^\ ]*)\}/)[0];
            name = name.replace(/\{([^\ ]*)\}/g, "$1");
            data['lang-' + name] = value[i].replace(/<!--\{\w+\}(.*)-->/g,'$1');
        }
    }
    elm.parentElement.innerHTML = data['lang-default'];
    return data;
}

// 处理 IMG
function serializeIMG(elm){
    var i=0,data = {},
    htmlstr = elm.outerHTML,
    imgurl = htmlstr.match(/src=\"(.*?)\"/);
    data.element = elm;
    data['lang-default'] = imgurl.length===2?imgurl[1]:'';
    imgurl = htmlstr.match(/data-lang-.(\w+).\".*?\"/g);
    if(imgurl && imgurl.length>0){
        for (; i < imgurl.length; i++) {
            var name = imgurl[i].match(/data-lang-(.*?)=/, "$1")[1];
            var value = imgurl[i].match(/data-lang-(.*?)=\"(.*?)\"/, "$1")[2];
            data['lang-' + name] = value;
        }
    }
    return data;
}

// 序列化翻译数据
function translater(elm,langData){
    langData = langData||{};

    if(elm.parentElement&&elm.parentElement.tagName === 'TITLE'){
        // 处理title里面的语言切换情况
        return serializeTitle(elm);
    }else if(elm.tagName === 'IMG'&&elm.nodeType === 1 ){
        // 处理 IMG
        return serializeIMG(elm);
    }

    var name = 'lang-default',value=elm.nodeValue,
        fragmentRE = /^\{\w+\}/;

    if(elm.nodeType === 8 && fragmentRE.test(value)){
        // 获取花括号内容
        name = value.match(fragmentRE)[0];
        // 去掉花括号
        name = 'lang-' + (name?name.replace(/\{([^\ ]*)\}/g, "$1"):'');
        // 获取好括号后面的内容
        value = value.replace(fragmentRE,"")
        if(trim(value) !== '') langData[name] = value;
    }

    if(trim(value) !== '' && !langData['lang-default']){
        langData[name] = value;  
        langData.element = elm;
    } 

    var nextElm = elm.nextSibling;
    if(nextElm&&nextElm.nodeType !== 1){
        translater(nextElm,langData)
    };
    return langData;
}

//过滤左右的空格以及换行符
function trim(text) {
    return "" + (null == text ? "" : (text + "").replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "").replace(/[\r\n]+/g,""));
}


function getUrlParam(name, searchStr) {
    // 兼容 ?id=22&name=%E4%B8%AD%E6%96%87&DEBUG 处理
    var url = searchStr || location.search;
    var params = {};

    if (url.indexOf('?') != -1) {
        var arr = url.substr(1).split('&');
        for(var i = 0, l = arr.length; i < l; i ++) {
            var kv = arr[i].split('=');
            params[kv[0]] = kv[1] && decodeURIComponent(kv[1]); // 有值解码，无值 undefined
        }
    }

    return name ? params[name] : params;
}

var getImgNodes = function(e){
    var i=0,result = [],imgs = e.getElementsByTagName('IMG');
    for (; i < imgs.length; i++) {
        var img_match = imgs[i].outerHTML.match(/data-lang-.(\w+).\".*?\"/g);
        if(imgs[i]
            &&imgs[i].nodeType === 1 
            &&img_match
            &&img_match.length>0
        ){
            result.push(imgs[i])
        }
    }
    return result;
}

//兼容的获取文本节点的简单方案
var getTextNodes = window.NodeFilter?function(e){
    //支持TreeWalker的浏览器
    var r=[],o,s;
    s=document.createTreeWalker(e,NodeFilter.SHOW_TEXT,null,null);
    while(o=s.nextNode()){
      if(o.parentElement.tagName !== 'SCRIPT' 
        && o.parentElement.tagName !== 'STYLE'
        && o.parentElement.tagName !== 'CODE'
        && trim(o.nodeValue) !== ''
        ) {
          r.push(o); //遍历迭代器
      }
    }   
    return r;
}:function(e){
    //不支持的需要遍历
    switch(e.nodeType){
      //注释节点直接返回
      case 3:return [e]; 
      case 1:;case 9: 
        //文档或元素需要遍历子节点
        var i,s=e.childNodes,result=[];
        if(e.tagName!== 'SCRIPT' 
            && e.tagName!== 'STYLE' 
            && e.tagName!== 'CODE' 
            && trim(o.nodeValue) !== ''){
            for(i=0;i<s.length;i++)
            getTextNodes(s[i]) && result.push(getTextNodes(s[i]));
            //合并子数组   
            return Array.prototype.concat.apply([],result); 
        }
    };
};
return Translater;
}));
