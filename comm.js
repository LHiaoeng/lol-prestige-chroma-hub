// document.domain = 'qq.com';

/**
 * ͨ��ȫ��loading��SVG�棩
 * ���أ�loading.init();
 * �Ƴ���loading.remove()
 * @type {{init: loading.init, remove: loading.remove, loadingSvg: string}}
 */
var loading = {
    init: function() {
        var loadDom = $('#loadingSvg');
        if (loadDom.length === 0) $('body').append(loading.loadingSvg);
    },
    remove: function() {
        $('#loadingSvg').remove();
    },
    loadingSvg: "<div id='loadingSvg' style='width: 100%;height: 100%;position: fixed;left: 0;top: 0;background: rgba(0,0,0,.5);z-index: 9999'><div style='width: 40px;height: 40px;position: absolute;left: 50%;top: 50%;margin-left: -20px;margin-top: -20px'><svg width='40px' height='40px' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid' class='uil-default'><rect x='0' y='0' width='100' height='100' fill='none' class='bk'></rect><rect  x='46.5' y='40' width='7' height='20' rx='5' ry='5' fill='#0baac0' transform='rotate(0 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0s' repeatCount='indefinite'/></rect><rect  x='46.5' y='40' width='7' height='20' rx='5' ry='5' fill='#0baac0' transform='rotate(30 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.08333333333333333s' repeatCount='indefinite'/></rect><rect  x='46.5' y='40' width='7' height='20' rx='5' ry='5' fill='#0baac0' transform='rotate(60 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.16666666666666666s' repeatCount='indefinite'/></rect><rect  x='46.5' y='40' width='7' height='20' rx='5' ry='5' fill='#0baac0' transform='rotate(90 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.25s' repeatCount='indefinite'/></rect><rect  x='46.5' y='40' width='7' height='20' rx='5' ry='5' fill='#0baac0' transform='rotate(120 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.3333333333333333s' repeatCount='indefinite'/></rect><rect  x='46.5' y='40' width='7' height='20' rx='5' ry='5' fill='#0baac0' transform='rotate(150 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.4166666666666667s' repeatCount='indefinite'/></rect><rect  x='46.5' y='40' width='7' height='20' rx='5' ry='5' fill='#0baac0' transform='rotate(180 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.5s' repeatCount='indefinite'/></rect><rect  x='46.5' y='40' width='7' height='20' rx='5' ry='5' fill='#0baac0' transform='rotate(210 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.5833333333333334s' repeatCount='indefinite'/></rect><rect  x='46.5' y='40' width='7' height='20' rx='5' ry='5' fill='#0baac0' transform='rotate(240 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.6666666666666666s' repeatCount='indefinite'/></rect><rect  x='46.5' y='40' width='7' height='20' rx='5' ry='5' fill='#0baac0' transform='rotate(270 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.75s' repeatCount='indefinite'/></rect><rect  x='46.5' y='40' width='7' height='20' rx='5' ry='5' fill='#0baac0' transform='rotate(300 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.8333333333333334s' repeatCount='indefinite'/></rect><rect  x='46.5' y='40' width='7' height='20' rx='5' ry='5' fill='#0baac0' transform='rotate(330 50 50) translate(0 -30)'>  <animate attributeName='opacity' from='1' to='0' dur='1s' begin='0.9166666666666666s' repeatCount='indefinite'/></rect></svg><p style='color: #fff; width: 100px; font-family:\"\5FAE\8F6F\96C5\9ED1\"; text-align: center; position: relative; left: 50%; margin-left: -50px;'>������</p></div></div>"
};

var cimi = {
    //��ʼִ��һ��
    init: function() {
        //������ESC������Ҫȥ��ë����Ч��
        $(document).keyup(function(event) {
            switch (event.keyCode) {
                case 27:
                case 96:
                    $('.g-wrap, #gfooter').css({
                        'filter': '',
                        'transition': '',
                        '-webkit-transition': ''
                    });
                    break;
            }
        });
        //ê����ת����Ч��
        $('a[href*=#],area[href*=#]').on('click', function() {
            if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
                var $target = $(this.hash);
                $target = $target.length && $target || $('[name=' + this.hash.slice(1) + ']');
                if ($target.length) {
                    var targetOffset = $target.offset().top;
                    $('html,body').animate({
                        scrollTop: targetOffset
                    }, 1000);
                    return false;
                }
            }
        });
        //�ѹ�ע����hover״̬
        $('body').on('mouseenter mouseleave', '.focus.on', function(e) {
            if (e.type === 'mouseenter') {
                $(this).text('ȡ����ע');
            } else if (e.type === 'mouseleave') {
                $(this).text('�ѹ�ע');
            }
        }).on('mouseenter mouseleave', '.focus.each', function(e) {
            if (e.type === 'mouseenter') {
                $(this).text('ȡ����ע');
            } else if (e.type === 'mouseleave') {
                $(this).html('<i class="icon-mutual"></i>�����ע');
            }
        });
        //�ղ�ҳ����Ѷ-����ҳ����˿��עtab,�л�
        cimi.bindTab('.user-collection a', '.collection');
        cimi.bindTab('.sel-btn-wrap a', '.fans_follow-wrap');
        //��˿-��ע��������ж�Ĭ����ʾ
        $(".user-popularity a").click(function() {
            var index = $(this).index();
            $(".sel-btn-wrap a").eq(index).addClass("on").siblings().removeClass("on");
            $(".fans_follow-wrap").eq(index).show().siblings(".fans_follow-wrap").hide();
        });
        //��Ϸ��Ϣҳ���չ��Բ��ͼ����
        $(".data-surface").click(function() {
            $(".content-right").hide();
            $(".content-right-open").fadeIn();
        });
        $(".btn-return").click(function() {
            $(".content-right").fadeIn();
            $(".content-right-open").hide();
        });
        // ����Ч��
        cimi.navOpen();
        cimi.setNavStatus();
        //����Ч��-�����ͷ
        // $('.nav-info-box').click(function(event) {
        // 	var onHas = $('.nav-info').hasClass('on');
        // 	$('.user-nav>a').removeClass('on-off');
        // 	if(onHas) {
        // 		$('.nav-info').addClass('on-off').removeClass('on');
        // 		cimi.navOpen();
        // 	} else {
        // 		cimi.navClose();
        // 	}
        // 	event.stopPropagation();
        // });
        //��Ϣҳ-�����л�
        $('.side-bar a').click(function() {
            var sbna = $(this).index();
            $(this).addClass('on').siblings().removeClass('on');
            $('.news-con .in-part').eq(sbna - 1).fadeIn().siblings().hide();
        });
    },
    //��ȡurl�Ĳ���
    getUrlParam: function(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        return r ? r[2].replace(/<iframe/g, "").replace(/<\/iframe>/g, "").replace(/<script/g, "").replace(/<\/script>/g, "").replace(/document.write/g, "").replace(/</g, "").replace(/>/g, "").replace(/alert/g, "").replace(/eval/g, "").replace(/"/g, "").replace(/'/g, "") : null;
    },
    /**
     * ʱ���ַ���תʱ���
     * @param dateStr
     * @returns {number}
     */
    getUnixTime: function(dateStr) {
        // var newstr = dateStr.replace(/-/g,'/');
        var newstr = dateStr.replace(/-|\./g, '/');
        var date = new Date(newstr);
        var time_str = date.getTime();
        //return time_str.substr(0, 10); //��������
        return time_str; //���غ�����
    },
    //����
    TGDialogS: function(e) {
        // ����milo������dialog���
        need("biz.dialog", function(Dialog) {
            Dialog.show({
                id: e,
                bgcolor: '#fff', //���������֡�����ɫ����ʽΪ"#FF6600"�����޸ģ�Ĭ��Ϊ"#fff"
                opacity: 50 //���������֡���͸���ȣ���ʽΪ��10-100������ѡ
            });
        });

        $('.g-wrap,#gfooter').css({
            'filter': 'blur(5px)',
            'transition': 'filter .3s linear',
            '-webkit-transition': 'filter .3s linear'
        });

    },
    closeDialog: function(e) {
        // ����milo������dialog���
        need("biz.dialog", function(Dialog) {
            Dialog.hide();
        });

        $('.g-wrap, #gfooter').css({
            'filter': '',
            'transition': '',
            '-webkit-transition': ''
        });
    },
    //tab�л�
    bindTab: function(head, content) {
        var selClass = 'on';
        $(head).on('click', function() {
            if ($(this).hasClass(selClass)) return;
            $(this).addClass(selClass).siblings().removeClass(selClass);
            $(content).hide().eq($(this).index()).fadeIn();
        });
    },
    //��������-������̬
    navCon: {
        open: [{
            "cnText": "�ҵ���ҳ",
            "enText": "HOME"

        }, {
            "cnText": "��Ϸ��Ϣ",
            "enText": "GAME INFO"

        }, {
            "cnText": "������������",
            "enText": "COMMUNITY TASK"

        }, {
            "cnText": "�ҵ���Ѷ",
            "enText": "INFORMATION"

        }],
        close: [{
            "cnText": "��ҳ",
            "enText": "HOME"

        }, {
            "cnText": "��Ϣ",
            "enText": "GAME"

        }, {
            "cnText": "����",
            "enText": "TASK"

        }, {
            "cnText": "��Ѷ",
            "enText": "NEWS"
        }]

    },
    //������Ѷ��չ��
    navOpen: function() {
        for (var i = 0; i < 4; i++) {
            $('.Chinese').eq(i).text(cimi.navCon.open[i].cnText);
            $('.English').eq(i).text(cimi.navCon.open[i].enText);
        }
        var $nav = $(".user-nav");
        if ($nav.hasClass("nav-2-author") || $nav.hasClass("nav-2-author-guest") || $nav.hasClass("nav-3-guest") || $nav.hasClass("nav-3-author")) {
            $('.nav-2-author>a').css('width', '50%');
            $('.nav-2-author-guest>a').css('width', '50%');
            $('.nav-3-author>a').css('width', '33.33%');
            $('.nav-3-guest>a').css('width', '33.3333%');
            if (!$(".nav-info").hasClass("on")) {
                $('.nav-2-author-guest .Chinese, .nav-2-guest .Chinese').eq(0).text('TA����ҳ');
                $('.nav-3-guest .nav-info-box .Chinese').text('TA����Ѷ');
                $('.nav-2-author-guest .nav-info-box .Chinese').text('TA����Ѷ');
            }
        }
        $('.nav-4>a').css('width', '25%');
    },
    //������Ѷ������
    navClose: function() {
        for (var i = 0; i < 4; i++) {
            $('.Chinese').eq(i).text(cimi.navCon.close[i].cnText);
            $('.English').eq(i).text(cimi.navCon.close[i].enText);
        }
        $('.nav-info').addClass('on').removeClass('on-off');
        $('.nav-4>a').css('width', '98px');
        $('.nav-3-guest>a').css('width', '146.5px');
        $('.nav-2-author>a').css('width', '400px');
        $('.nav-2-author-guest>a').css('width', '400px');
        $('.nav-3-author>a').css('width', '280px');
    },
    //��λ��ǰҳ����
    setNavStatus: function() {
        var $g_wrap = $(".g-wrap");
        if ($g_wrap.hasClass("g-community")) {
            $(".user-nav a").eq(2).addClass("on");
        } else if ($g_wrap.hasClass("g-index")) {
            $(".user-nav a").eq(0).addClass("on");
        } else if ($g_wrap.hasClass("g-game_info")) {
            $(".user-nav a").eq(1).addClass("on");
        }
        //Ĭ�ϴ���Ѷ����
        var initGrid = cimi.getUrlParam('initGrid');
        if (initGrid === '0') {
            cimi.navClose();
            $(".nav-info a").eq(0).addClass("on")
        } else if (initGrid === '1') {
            $(".nav-info a").eq(1).addClass("on")
            cimi.navClose();
        } else if (initGrid === '2') {
            $(".nav-info a").eq(2).addClass("on")
            cimi.navClose();
        }
        //�����ѶĬ������ҳ
        // $(".nav-info-box").click(function() {
        // 	if($(".nav-info a").hasClass("on")) return;
        // 	window.location.href = "news_article.shtml";
        // })
    },
    //������ĳ��
    scrollRoll: function(class_name) {
        var scroll_top = $(class_name).offset().top - 70;
        $('html,body').animate({
            scrollTop: scroll_top
        }, 500);
    },
    //����ʱ������
    getAccTime: function(strDate) {
        var result = '';
        var date = new Date();
        var timeStr = cimi.getUnixTime(strDate);
        var dateTimeStr = date.getTime();
        var disparity = dateTimeStr - timeStr;
        if (disparity < 60 * 1000) {
            result = '�ո�';
        } else if (disparity > 60 * 1000 && disparity < 3600 * 1000) {
            result = Math.round(disparity / 1000 / 60) + '����ǰ';
        } else if (disparity > 3600 * 1000 && disparity < 86400 * 1000) {
            result = Math.round(disparity / 1000 / 60 / 60) + 'Сʱǰ';
        } else if (disparity >= 86400 * 1000 && disparity <= 86400 * 1000 * 3) {
            result = Math.round(disparity / 1000 / 60 / 60 / 24) + '��ǰ';
        } else if (disparity > 86400 * 1000) {
            var tmpDate = strDate.split(' ');
            result = tmpDate && tmpDate.length > 0 ? tmpDate[0] : '';
        }
        return result;
    },
    //�Ķ�������
    getCnCount: function(count) {
        var result = '';
        var intCount = parseInt(count);
        if (intCount > 9999 && intCount <= 99999999) {
            result = Math.floor(intCount / 10000 * 10) / 10 + '��';
        } else if (intCount > 99999999) {
            result = Math.floor(intCount / 100000000 * 10) / 10 + '��';
        } else {
            result = count;
        }
        return result;
    },
    //��תʱ��
    getMinAndSec: function(data) {
        var min = Math.floor(+data / 60);
        if (min.toString().length <= 1) {
            min = '0' + min;
        }
        var sec = +data % 60;
        if (sec.toString().length <= 1) {
            sec = '0' + sec;
        }
        return min + ':' + sec;
    },
    //�ж�a�ַ�����β�Ƿ���b�ַ���
    judgeEndStr: function(a, b) {
        var d = a.length - b.length;
        return (d >= 0 && a.lastIndexOf(b) === d);
    }
};

cimi.init();

//����ʱ������
template.helper('getAccTime', function(strDate) {
    return cimi.getAccTime(strDate);
});
//�Ķ�������
template.helper('getCnCount', function(count) {
    return cimi.getCnCount(count);
});
//��תʱ��
template.helper('getMinAndSec', function(sec) {
    return cimi.getMinAndSec(sec);
});

//IE8����bind(this)
(function() {
    if (!Function.prototype.bind) {
        Function.prototype.bind = function(oThis) {
            if (typeof this !== "function") {
                throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
            }
            var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                fNOP = function() {},
                fBound = function() {
                    return fToBind.apply(this instanceof fNOP && oThis ?
                        this :
                        oThis,
                        aArgs.concat(Array.prototype.slice.call(arguments)));
                };
            fNOP.prototype = this.prototype;
            fBound.prototype = new fNOP();
            return fBound;
        };
    }
}());

/**
 * ������,���ʹ���,���ظ�����
 * params:{
 * tryTimes:���Դ���,Ĭ��5��,
 * tryInterval:ÿ�γ��Լ��ʱ��,Ĭ��800����
 * requestType:ajax��getScript,����,��ͬ���͵Ľӿڶ�Ӧ�Ĵ����ʽ��һ��,
 * successBack:����,ִ�гɹ��ص�.
 * failBack:���Դ����þ�,ִ��ʧ�ܻص�,�ص������ڸ����������ִ��.
 * data:����������Ϊajax��ʹ��,���ǲ�Ҫ����url,success��error�ص�����,ʹ��apiUrl,successBack��failBack
 * apiUrl:����.
 * attach:���ӵĶ���,���԰�ĳЩ�����������.
 * }
 * **/
var RequestApi = function(params) {
    //�����ж�
    if (!(this instanceof RequestApi)) return new RequestApi(params);

    this.tryTimes = params['tryTimes'] || 5;
    this.tryInterval = params['tryInterval'] || 1000;
    this.apiUrl = encodeURI(params.apiUrl);
    this.requestType = params.requestType || 'ajax';
    this.successBack = params.successBack;
    this.failBack = params['failBack'] || null;
    this.params = params;
    this.requestObject = null;
    this.attach = params['attach'] || null;
    this.requestOne(true);
};
/**
 * @param immediately Ĭ��false,�Ӻ����õļ��ʱ������;true,���̷�������
 */
RequestApi.prototype.requestOne = function(immediately) {
    //�ж�����ʱ��
    var delayTime = immediately ? 0 : this.tryInterval;
    //������һ
    --this.tryTimes;
    //���Թر���һ������
    this.request$ && this.request$.abort();
    if (this.tryTimes === 0) {
        //��������þ�,ִ��ʧ�ܺ���
        this.failBack && this.failBack();
    } else {
        //�ж��Ƿ�ѡ���Ӻ���
        setTimeout(function() {
            switch (this.requestType) {
                case 'ajax':
                    {
                        this.ajax();
                        break;
                    }
                case 'getScript':
                    {
                        this.getScript();
                        break;
                    }
            }
        }.bind(this), delayTime);
    }
};
RequestApi.prototype.ajax = function() {
    var defaultData = {
        dataType: 'jsonp'
    };
    var ajaxParams = $.extend(defaultData, this.params.data);
    ajaxParams['success'] = function(data) {
        // var urlSplit = this.apiUrl.split('/');
        // console.log(urlSplit[urlSplit.length-1],'\n',data);
        this.successBack && this.successBack(data);
    }.bind(this);
    ajaxParams['timeout'] || (ajaxParams['timeout'] = this.tryInterval);
    ajaxParams['error'] = function(XMLHttpRequest, textStatus, errorThrown) {
        console.log("ʧ��: " + this.apiUrl, textStatus);
        this.requestOne();
    }.bind(this);
    ajaxParams['url'] = this.apiUrl;
    this.requestObject = $.ajax(ajaxParams);
};
RequestApi.prototype.getScript = function() {
    this.requestObject = $.getScript(this.params.apiUrl).done(this.successBack.bind(this)).fail(function() {
        console.log("ʧ��" + this.apiUrl);
        this.requestOne();
    }.bind(this));
};

/*
 * ������
 * ������include /v3/inc/foot.inc�����js��jquery��topModulejs
 * */
var CommonFunc = {
    // gUserUinCookieKey: 'LOL_API_W2013_USER_', //����ͷ���û�Uin��cookie������ͷ���û�����self.gUserUinCookieKey + LoginManager.getUserUin() + 'Area'��
    // gCookieKeyAccoundId: 'F_PERSONAL_GID', //��̬accoundId
    // gCookieKeyAccoundArea: 'F_PERSONAL_AREAID', //��̬areaId
    gAccountId: '', //accountId
    gAccountArea: '', //����id
    gAccountUuid: '', //uuid
    gAuthorId: null, //����id
    gGuestId: cimi.getUrlParam('id'), //��̬�õ���id���ж��Ƿ��ǿ�̬������
    gGuestAuthorId: null,
    gCurrentSeason: 'current', //��ǰ������PlayerRankInfo�ӿ���Ҫ�õ����ֶ��޸� s9,pres10
    apiWeGame: '//lol.ams.game.qq.com/lol/autocms/v1/transit/LOL/LOLWeb/Official/', //WeGame�ӿ�ǰ׺
    // apiKOL: '//apps.game.qq.com/wmp/lol_api_7982.php?path=', //KOL���Խӿ�ǰ׺
    apiKOL: 'https://apps.game.qq.com/cmc/', //KOL�ӿ�ǰ׺
    apiWMP: 'https://apps.game.qq.com/wmp/v3.1/', //WMP�ӿ�ǰ׺
    //�ҵĹ�ע����
    myFollowData: {
        list: [], //�Ƽ��б�
        status: {}, //�����Ƿ��ע��״̬��ֵ��
        createTime: 0 //����ʱ��㡣��һ������start_time=0��֮�������start_time = ��һ�������create_time
        //lastRequestTime: 0 //����ʱ��㡣��һ��������Ҫ��֮�������last_req_time = ��һ�������last_req_time
    },
    //�ҵķ�˿����
    myFansData: {
        list: [], //�Ƽ��б�
        status: {}, //�����Ƿ��ע��״̬��ֵ��
        createTime: 0, //����ʱ��㡣��һ������start_time=0��֮�������start_time = ��һ�������create_time
        lastRequestTime: 0 //����ʱ��㡣��һ��������Ҫ��֮�������last_req_time = ��һ�������last_req_time
    },
    clickEnable: true, //�Ƿ���Ӧ�������ֹ�ظ�����
    //��ʼ������
    /*init: function () {
        CommonFunc.gAccountId = milo.cookie.get(CommonFunc.gCookieKeyAccoundId);
        CommonFunc.gAccountArea = milo.cookie.get(CommonFunc.gCookieKeyAccoundArea);
        �Ƴ�ҳͷ��ע���¼�,ִ�������������ĵ�����ע��
        $('.top-user-area>.link-loginout').attr('href', 'javascript:').on('click', function () {
            CommonFunc.pageLogout();
        });
        �Ƴ�ҳͷѡ������¼�,ִ������������������ѡ�����
        $('#jUserArea').attr('href', 'javascript:').on('click', function () {
            CommonFunc.changeArea();
        });
    },*/
    /*
     * ��¼--�����
     * ��ҳ���JS��Ҫ��loginBack�ص�֮����ִ��
     * */
    login: function(loginBack) {
        var self = CommonFunc;
        var loseServerLogin = function(tLogin) {
            tLogin.login();
        };
        var bindAreaS = function(tLogin) {
            //���
            tLogin.unbind(tLogin.eventType.boundArea, this);
            tLogin.unbind(tLogin.eventType.noWegameArea, this);
            //�󶨴����ɹ�
            self.gAccountArea = tLogin.gAccountArea;
            self.gAccountId = tLogin.gAccountId;
            //�������û�ֱ���˳�
            var whiteUinArr=['319938728','1841463564','1104199713','3153095528','1095009123','3127389997','879493801'];

            for(var wi=0;wi<whiteUinArr.length;wi++){
                if(self.gAccountId==whiteUinArr[wi]){
                    return;
                }
            }

            //�ж�����̬
            if (self.gGuestId) {
                self.guestRequests(function() {
                    loginBack && loginBack();
                });
            } else {
                self.hostRequests(function() {
                    loginBack && loginBack();
                });
            }
            //EAS�ϱ�
            EAS.need('iu', function() {
                EAS.iu.init({
                    'userId': tLogin.LoginManager.getUserUin(),
                    'openId': tLogin.LoginManager.getUserUin(),
                    'agent': 'web',
                    'channel': 'qq',
                    'area': tLogin.gAccountArea,
                    'serviceType': 'lol',
                    'iuName': 'u_lol'
                }, function() {});
            });
            //console.log('bindAreaS');
        };
        var noBindWegame = function(tLogin) {
            //wegameû�а󶨴�������
            tLogin.unbind(tLogin.eventType.noWegameArea, this);
            //���߲��󶨴���
            self.requestPlayerAccount(function(data) {
                // data.author = 171;
                if (data.author) {
                    //���߲���Ҫ�󶨴���
                    self.gAccountId = tLogin.gAccountId;
                    self.gAuthorId = data.author;
                    //�ж�����̬
                    if (self.gGuestId) {
                        self.guestRequests(function() {
                            loginBack && loginBack();
                        });
                    } else {
                        self.hostAuthorRequests(function() {
                            loginBack && loginBack();
                        });
                    }
                    //EAS�ϱ�
                    EAS.need('iu', function() {
                        EAS.iu.init({
                            'userId': tLogin.LoginManager.getUserUin(),
                            'openId': tLogin.LoginManager.getUserUin(),
                            'agent': 'web',
                            'channel': 'qq',
                            'area': '',
                            'serviceType': 'lol',
                            'iuName': 'u_lol'
                        }, function() {});
                    });
                } else {
                    tLogin.changeArea();
                    $('.userinfo').show();
                    $('.user-subscription').show();
                    $('.user-task').show();
                    $('.recommend-follow').show();
                    $('.user-gameinfo, .user-gameinfo-self').show();
                }
            });
        };

        /*����¼״̬*/
        var loginS = function(tLogin) {
            //���
            tLogin.unbind(tLogin.eventType.login, this);
            //������ȡwegame�����ɹ��¼�
            tLogin.on(tLogin.eventType.boundArea, bindAreaS, this);
            //������ȡwegame����ʧ���¼�
            tLogin.on(tLogin.eventType.noWegameArea, noBindWegame, this);
            //��ѯ�Ƿ�󶨴���
            if (!tLogin.askingArea) {
                //20201119 by v_junzwang ����js�ļ�LOL_Login TopModule���е��ôη���
                //tLogin.askWegameArea();
            }
            //cvip�û��ɳ���ϵ  ��¼�ϱ�   996  20180108
            ToolsFunc.CvipSendLogToEas("lol_shequ_login", "web");
            //console.log('loginS')
        };

        /*��������ʼ��״̬*/
        var readyS = function(tLogin) {
            //��¼����ɹ���ʼ��,�жϵ�¼״̬
            tLogin.on(tLogin.eventType.login, loginS, this);
            //�����¼
            tLogin.login();
            //console.log('readyS')

            tLogin.LoginManager.checkLogin(function() {

            }, function() {
                //δ��¼��ʾδ��¼��Ԫ��
                $('.userinfo').show();
                $('.user-gameinfo').show();
                $('.user-subscription').show();
                $('.user-task').show();
                $('.recommend-follow').show();
            });
        };
        var readyF = function(tLogin) {
            //��¼������ڳ�ʼ��,������ʼ���ɹ��¼�
            tLogin.on(tLogin.eventType.ready, readyS, this);
            //console.log('readyF')
        };
        T_Login.checkReady(readyS, readyF);
        //�����������ӿ�timeout��¼̬ʧЧ�¼�
        T_Login.on(T_Login.eventType.loseServerLogin, loseServerLogin, this);
    },
    //������λ��Ϣ
    parseRankInfo: function(data) {
        if (data.PlayerRankInfo.msg.retCode === 0) {
            var respRankList = data.PlayerRankInfo.msg.data.item_list;
            for (var i = 0, j = respRankList.length; i < j; ++i) {
                //��ȡÿ����λ��url������
                //obj.queue ��������ԭʼ���� 1 ��˫�ţ� 4 �������5v5�� 5 �������3v3
                respRankList[i] = CommonFunc.getTierText(respRankList[i]);
            }
            return respRankList;
        } else {
            //��λ������
            return [{
                extended_battle_type: "��/˫��λ��",
                extended_queue: "",
                extended_tier: "���޶�λ",
                extended_tier_url: "//ossweb-img.qq.com/images/lol/space/rank/2019pre/default.png"
            }, {
                extended_battle_type: "�������5v5",
                extended_queue: "",
                extended_tier: "���޶�λ",
                extended_tier_url: "//ossweb-img.qq.com/images/lol/space/rank/2019pre/default.png"
            }, {
                extended_battle_type: "�������3v3",
                extended_queue: "",
                extended_tier: "���޶�λ",
                extended_tier_url: "//ossweb-img.qq.com/images/lol/space/rank/2019pre/default.png"
            }];
        }
    },
    /*
     * ��̬��������
     * requestPlayerAccount �ж��Ƿ�������
     * */
    hostRequests: function(callback) {
        var self = CommonFunc;
        loading.init();
        self.requestDynamicInfo();
        self.requestPlayerAccount(function(data) {
            //������̬���� S
            //data.author = 171;
            if (data.author) {
                //����
                CommonFunc.gAuthorId = data.author;
                $('.user-nav').removeClass('nav-4').addClass('nav-3-author');
                //���
                CommonFunc.requestAuthorList(CommonFunc.gAuthorId, function(data) {
                    self.setAuthorInfo(data[0]);
                });
                //Ĭ����ת������ҳ
                $('.nav-info-box').attr('onclick', 'location.href=\'news.shtml?initGrid=0\'');

                $('#communityLv').text('�����ȼ�Lv.' + T_Login.gAccountData.PlayerCommunityInfo.level);
                $('#mengCoinNum').text(T_Login.gAccountData.PlayerCommunityInfo.mb);
            } else {
                //��ͨ�û�
                $('.user-nav').removeClass('nav-4').addClass('nav-3');
                $('.user-nav .nav-info').hide();
                self.setGameInfo(self.gAccountId, self.gAccountArea, self.getAreaById(self.gAccountArea));
                self.requestPlayerInfo();
                self.requestLevelAndCoin(function(playerCommunityInfoData) {
                    self.setCommunityLevelAndCoin(playerCommunityInfoData);
                });
            }
            $('.user-nav').fadeIn();
            cimi.navOpen();
            cimi.setNavStatus();
            //������̬���� E
            self.requestFollowList();
            self.requestFanList();
            $('.userinfo').fadeIn();
            callback && callback();

            loading.remove();
        });
    },
    /*
     * ��̬��������󶨴�����������
     * */
    hostAuthorRequests: function(callback) {
        var self = CommonFunc;
        loading.init();
        //����
        $('.user-nav').removeClass('nav-4').addClass('nav-2-author');
        //���
        CommonFunc.requestAuthorList(CommonFunc.gAuthorId, function(data) {
            self.setAuthorInfo(data[0]);
        });
        //Ĭ����ת������ҳ
        $('.nav-info-box').attr('onclick', 'location.href=\'news.shtml?initGrid=0\'');

        self.requestLevelAndCoin(function(playerCommunityInfoData) {
            $('.d-wrap-2').show().find('a').slice(1).hide();
            $('#communityLv').text('�����ȼ�Lv.' + playerCommunityInfoData.level);
            $('#mengCoinNum').text(playerCommunityInfoData.mb);
        });

        // self.requestZMInfo(self.gGuestId, function (mobilePlayerInfoData, playerCommunityInfoData) {
        //
        //     var $head = $('.comm-head');
        //     var zmInfo = mobilePlayerInfoData.res.uuid_prifle_list[0];
        //     if (zmInfo.logo_url && zmInfo.logo_url.length > 0) {
        //         $head.find('.head-userinfo-avatar img').attr('src', zmInfo.logo_url);
        //     }
        //     $head.find('.head-userinfo-normal .logined>.logined-name').text(zmInfo.nick);
        //     $head.find('.unlogin').hide();
        //     $head.find('.login-unbindarea').hide();
        //     $head.find('.logined').show();
        //     $head.find('.select-area').text('���޴���');
        //
        //     loading.remove();
        // });

        $('.userinfo').fadeIn();
        $('.user-task').hide();
        $('.user-nav').show();
        cimi.navOpen();
        cimi.setNavStatus();
        //������̬���� E
        self.requestFollowList();
        self.requestFanList();

        loading.remove();
        callback && callback();
    },
    /*
     * ��̬��������
     * */
    guestRequests: function(callback) {
        var self = CommonFunc;
        loading.init();
        $('.fans_follow .sel-btn-wrap a').eq(0).text('TA�ķ�˿');
        $('.fans_follow .sel-btn-wrap a').eq(1).text('TA�Ĺ�ע');
        $('.user-gameinfo .primary-title, .user-gameinfo-self .primary-title').text('TA����Ϸ��Ϣ');
        self.requestPlayerAccount(function() {
            self.requestFollowList();
            self.requestFanList();
        });
        self.requestUuidToAuthorId(self.gGuestId, function(authorId) {
            if (authorId) {
                //����
                self.gGuestAuthorId = authorId;
                self.requestAuthorList(authorId, function(data) {
                    self.setAuthorInfo(data[0]);
                });
                self.requestLevelAndCoin(function(playerCommunityInfoData) {
                    $('#communityLv').text('�����ȼ�Lv.' + playerCommunityInfoData.level);
                });
            } else {
                //��ͨ�û�
                self.requestPlayerInfo();
                self.requestZMInfo(self.gGuestId, function(mobilePlayerInfoData) {
                    self.setCommunityInfo(mobilePlayerInfoData);
                });
                self.requestLevelAndCoin(function(playerCommunityInfoData) {
                    self.setCommunityLevelAndCoin(playerCommunityInfoData);
                });
            }
            //���¿�̬���� S
            $('.user-nav').show();
            $('.user-nav > a').each(function(i, e) {
                if ($(e).attr('href').indexOf('?id=') === -1) {
                    $(e).attr('href', $(e).attr('href') + '?id=' + self.gGuestId);
                }
            });
            $('.nav-info a').each(function(i, e) {
                $(e).attr('href', $(e).attr('href') + '&id=' + self.gGuestId);
            });
            if (self.gGuestAuthorId) {
                $('.user-nav').removeClass('nav-4 nav-3').addClass('nav-2-author-guest');
                cimi.navOpen();
                cimi.setNavStatus();
                $('.user-gameinfo, .user-gameinfo-self').hide();
                $('.nav-info-box').attr('onclick', 'location.href=\'news.shtml?initGrid=0&id=' + self.gGuestId + '\'');
            } else {
                $('.user-nav').removeClass('nav-4 nav-3').addClass('nav-2-guest');
                $('.user-nav .Chinese').eq(0).text('TA����ҳ');
            }
            loading.remove();
            $('.userinfo').fadeIn();
            //���¿�̬���� E
            callback && callback();
        });
    },
    //����������Ϣ
    setCommunityInfo: function(mobilePlayerInfoData) {
        var zmInfo = mobilePlayerInfoData.res.uuid_prifle_list[0];
        if (zmInfo.logo_url && zmInfo.logo_url.length > 0) {
            $('.user-head-bg').removeClass('user-head-none');
            var logoUrl = CommonFunc.parseLogoUrl(zmInfo.logo_url);
            logoUrl = logoUrl.replace('http://', '//');
            $('#communityHead').attr('src', logoUrl);
            $('.por-class-bg img').attr('src', logoUrl); //��������ͷ��
        }
        $('#communityName').text(zmInfo.nick);
        if (+zmInfo.gender === 1) $('#communityGender').attr('class', 'icon-man');
        else if (+zmInfo.gender === 2) $('#communityGender').attr('class', 'icon-woman');
    },
    //���������ȼ� �ȱ�
    setCommunityLevelAndCoin: function(data) {
        $('#communityLv').text('�����ȼ�Lv.' + data.level);
        $('#mengCoinNum').text(data.mb);
    },
    //���õ�¼�����Ϣ��ʾ�������¼��Ϣ
    setGameInfo: function(accountId, areaId, areaName) {
        var self = CommonFunc;
        $("#areasel").html("�����Ĵ�����");
        $("#person_jUserArea").html(areaName).show();
        $("#J_logout").show();
        $(".J_login").hide();

        self.gAccountArea = areaId;
        self.gAccountId = accountId;
        // milo.cookie.set(self.gCookieKeyAccoundId, accountId);
        // milo.cookie.set(self.gCookieKeyAccoundArea, areaId);
        // milo.cookie.set(self.gUserUinCookieKey + LoginManager.getUserUin() + 'Area', areaId);
        //��Ҫ,��ͨҳͷ�������������Ϣ
        // LW201310_Userinfo && LW201310_Userinfo.userBaseinfo(LoginManager.getUserUin(), areaId);
    },
    //��������ߣ��������߽���
    setAuthorInfo: function(data) {
        $('#communityName').text(data.nickname);
        if (data.avatar && data.avatar.length > 0) {
            $('#communityHead').attr('src', data.avatar);
            $('.user-head-bg').removeClass('user-head-none');
            $('.por-class-bg img').attr('src', data.avatar); //��������ͷ��
        }
        $('.user-introduce').text(data.introduction);

        //�����ް󶨴���
        if (CommonFunc.gAccountArea.length === 0) {
            var $head = $('.comm-head');
            $head.find('.head-userinfo-avatar img').attr('src', data.avatar);
            $head.find('.head-userinfo-normal .logined>.logined-name').text(data.nickname);
            $head.find('.unlogin').hide();
            $head.find('.login-unbindarea').hide();
            $head.find('.logined').show();
            $head.find('.select-area').text('���޴���');
        }
    },
    //���ݴ���id��ѯ��������
    getAreaById: function(areaId) {
        if (areaId == 31) {
            return "Ͽ��֮��";
        }
        for (var x in LOLServerSelect.STD_DATA) {
            if (areaId == LOLServerSelect.STD_DATA[x].v) {
                var areaInfo = LOLServerSelect.STD_DATA[x].t.split(' ');
                return areaInfo[0];
            }
        }
        return '';
    },
    //uuidתauthorid
    requestUuidToAuthorId: function(uuid, callback) {
        new RequestApi({
            apiUrl: CommonFunc.apiWeGame + 'UUID2Author?uuid=' + uuid,
            data: {
                xhrFields: {
                    withCredentials: true
                }
            },
            successBack: function(data) {
                callback && callback(data);
            },
            failBack: function() {

            }
        })
    },
    //��ȡ�ٻ�ʦ��Ϣ
    requestPlayerInfo: function(callback) {
        var goUrl = CommonFunc.apiWeGame + 'PlayerInfo?use=acc&area=' + CommonFunc.gAccountArea;
        if (CommonFunc.gGuestId) {
            goUrl += '&uuid=' + CommonFunc.gGuestId;
        }
        new RequestApi({
            apiUrl: goUrl,
            data: {
                xhrFields: {
                    withCredentials: true
                }
            },
            successBack: function(data) {
                if (+data.retCode === 0) {
                    var iconHTML = '<img src="//game.gtimg.cn/images/lol/act/img/profileicon/' + data.icon_id + '.png">';
                    $('.J_gameName').text(data.name);
                    $('.user-gameinfo .user-head-img, .user-gameinfo-self .user-head-img').html(iconHTML);
                    $('.J_level').html('Lv.' + data.level);
                    $('.user-gameinfo, .user-gameinfo-self').removeClass('nologin').fadeIn();

                    callback && callback(data);
                } else {
                    $('.user-gameinfo, .user-gameinfo-self').show().find('.nologin-tips').html(CommonFunc.getAreaById(T_Login.gAccountArea) + '<a href="javascript:T_Login.changeArea()" class="J_bindarea">���л�������</a> ������Ϸ��Ϣ');
                }
            },
            failBack: function() {
                $('.user-gameinfo, .user-gameinfo-self').show().find('.nologin-tips').html(CommonFunc.getAreaById(T_Login.gAccountArea) + '<a href="javascript:T_Login.changeArea()" class="J_bindarea">���л�������</a> ������Ϸ��Ϣ');
            }
        });
    },
    //��ȡ�ҵ���Ϸ��Ϣ
    requestUserGameInfo: function() {
        var self = CommonFunc;
        var goUrl = self.apiWeGame + 'PlayerRankInfo,PlayerFavChamps?use=acc&area=' + self.gAccountArea + '&season=' + self.gCurrentSeason;
        if (self.gGuestId) {
            goUrl = self.apiWeGame + 'PlayerRankInfo,PlayerFavChamps?use=acc&area=' + self.gAccountArea + '&season=' + self.gCurrentSeason + '&uuid=' + self.gGuestId;
        }
        new RequestApi({
            apiUrl: goUrl,
            data: {
                xhrFields: {
                    withCredentials: true
                }
            },
            successBack: function(data) {
                //��ȯ����ɫ����
                // if (data.PlayerProperty) {
                //     if (data.PlayerProperty.status === 0) {
                //         if (self.gGuestId) {
                //             $('.p-wrap-gi0').css('margin-top', '22px');
                //         } else {
                //             $('.p-wrap-gi2').show();
                //             $("#J_dianquan").html('<i class="icon-rp"></i>' + data.PlayerProperty.msg.rp_amount); //��ȯ
                //             $("#J_blue_jincui").html('<i class="icon-bcj"></i>' + data.PlayerProperty.msg.ip_amount); //��ɫ����
                //         }
                //     }
                // }
                //�����λ��Ϣ
                if (data.PlayerRankInfo) {
                    if (data.PlayerRankInfo.status === 0) {
                        $('#lv-group').html(template('tpl_lv_group', {
                            list: self.parseRankInfo(data)
                        }));
                    }
                }
                //��ҳ���Ӣ��
                if (data.PlayerFavChamps) {
                    if (data.PlayerFavChamps.status === 0) {
                        if (data.PlayerFavChamps.msg.retCode !== 0) {
                            $('#often-hero-list').html('��������');
                            return;
                        }
                        var respChampList = data.PlayerFavChamps.msg.data.champions;
                        //ѭ����ȡӢ�����Ƶ�����
                        self.championData = [];
                        for (var i = 0, j = respChampList.length; i < j; ++i) {
                            self.championData.push(self.getChampionData(respChampList[i]['champion_id'], respChampList[i]));
                        }
                        //ģ����Ⱦ
                        $('#often-hero-list').html(template('tpl_often_hero_list', {
                            championData: self.championData
                        }));

                        //���б���ʾ�������
                        $('.user-gameinfo .often-hero-head').on('click', function() {
                            $(this).addClass('on').siblings().removeClass('on');
                            __showPlayerFavChampDetail($(this).index());
                        });
                        //��ʾ��һ��
                        __showPlayerFavChampDetail(0);

                        function __showPlayerFavChampDetail(index) {
                            var nowChampionData = self.championData[index];
                            $('.hero-info-wrap').stop().hide().fadeIn();
                            $('.hero-info-wrap img').attr('src', nowChampionData.avatarPic);
                            $('.hero-info-wrap .hero-info span').text(nowChampionData.name_cn);
                            $('#mainData-t').html(respChampList[index].win_num);
                            $('#mainData-wt').text((respChampList[index].win_num / respChampList[index].use_num * 100 >> 0) + '%');
                        }
                    }
                }
            },
            failBack: function() {

            }
        });

        new RequestApi({
            apiUrl: '//lol.sw.game.qq.com/lol/lwdcommact/a20201118playerProperty/a20201118playerProperty/getUserIPRP?area='+ self.gAccountArea,
            data: {
                xhrFields: {
                    withCredentials: true
                }
            },
            successBack: function(data) {
                //��ȯ����ɫ����
                console.log(data);
                if (data.code == 0) {
                    if (self.gGuestId) {
                        $('.p-wrap-gi0').css('margin-top', '22px');
                    } else {
                        $('.p-wrap-gi2').show();
                        $("#J_dianquan").html('<i class="icon-rp"></i>' + data.data.rp_amount); //��ȯ
                        $("#J_blue_jincui").html('<i class="icon-bcj"></i>' + data.data.ip_amount); //��ɫ����
                        $('#commHeadDianQuan').text(data.data.rp_amount);
                        $('#commHeadJingCui').text(data.data.ip_amount);
                    }
                }
            },
            failBack: function() {

            }
        });
    },
    //��������ID�б��ȡ������Ϣ
    requestAuthorList: function(authorid, callback) {
        new RequestApi({
            apiUrl: CommonFunc.apiKOL + 'zmMcnAuthorList?r0=jsonp&authorid=' + authorid,
            data: {
                jsonp: 'r1'
            },
            successBack: function(data) {
                if (+data.status === 1) {
                    //console.log(data.data.result);
                    if(data.data.result){
                        if(data.data.result[0].avatar == ""){
                            $.getScript("https://lol.sw.game.qq.com/lol/lwdcommact/a20210316nicklogo/nickLogo/getNickLogo?r0=string&r1=callbackobj&uuid="+data.data.result['0'].uuid, function (res) {
                                if (callbackobj.status == 0) {

                                    if( data.data.result[0].nickname == ""){
                                        //���⸲������
                                        data.data.result[0].nickname =callbackobj.data.nickname;
                                    }
                                    data.data.result[0].avatar = callbackobj.data.headUrl;

                                    callback && callback(data.data.result);
                                }

                            });
                        }else{
                            callback && callback(data.data.result);
                        }
                    }
                }
            },
            failBack: function() {

            }
        })
    },
    //�����û�������Ϣ
    requestZMInfo: function(uuid, callback) {
        var goUrl = CommonFunc.apiWeGame + 'MobilePlayerInfo?use=zm,uid';
        if (uuid) {
            goUrl += '&uuid=' + uuid;
        }
        new RequestApi({
            apiUrl: goUrl,
            data: {
                xhrFields: {
                    withCredentials: true
                }
            },
            successBack: function(data) {
                if (+data.MobilePlayerInfo.status === 0) {
                    callback && callback(data.MobilePlayerInfo.msg);
                }
            },
            failBack: function() {

            }
        })
    },
    //�����ȼ� �ȱ�
    requestLevelAndCoin: function(callback) {
        new T_RequestApi({
            apiUrl: '//lol.sw.game.qq.com/lol/lwdcommact/a20201118playerProperty/a20201118playerProperty/getCommunityInfo',
            data: {
                xhrFields: {
                    withCredentials: true
                }
            },
            successBack: function (data) {
                console.log(data);
                if (data.code == 0) {
                    callback && callback(data.data);
                }
            }
        });
    },
    //��������ID�б��ȡ������Ϣ����������uuid����Ϸ����account������areaʱ���أ���KOL����id�����û�����ʾ�����ߣ�
    requestPlayerAccount: function(playerAccountBack) {
        var goUrl = CommonFunc.apiWeGame + 'GetPlayerAccount';
        if (CommonFunc.gAccountArea.length > 0) {
            goUrl += '?area=' + CommonFunc.gAccountArea;
        }
        new RequestApi({
            apiUrl: goUrl,
            data: {
                xhrFields: {
                    withCredentials: true
                }
            },
            successBack: function(data) {
                CommonFunc.gAccountUuid = data.uuid;
                playerAccountBack && playerAccountBack(data);
            },
            failBack: function() {

            }
        })
    },
    //����id,Ѱ��Ĭ��Ƥ��,ͷ��,����
    getChampionData: function(id, obj) {
        var result = obj || {};
        var name = LOLherojs.skins.keys[id];
        //ͷ��
        var avatarPic = '//ossweb-img.qq.com/images/lol/img/champion/' + name + '.png';
        //Ĭ��Ƥ��
        var defaultSkin = '//ossweb-img.qq.com/images/lol/web201310/skin/big' + LOLherojs.skins.data[name][0].id + '.jpg';

        var title_cn = LOLherojs.champion.data[name].title;
        var name_cn = LOLherojs.champion.data[name].name;

        result.id = id;
        result.name = name;
        result.avatarPic = avatarPic;
        result.defaultSkin = defaultSkin;
        result.title_cn = title_cn;
        result.name_cn = name_cn;
        result.tags = LOLherojs.champion.data[name].tags;

        return result;
    },
    //�ж�����ͷ���Ƿ���Ҫ�ӳߴ����
    parseLogoUrl: function(o) {
        var logoSizeParam = '/0';
        if (typeof(o) === 'string') {
            if (!cimi.judgeEndStr(o, logoSizeParam)) {
                if (o.indexOf('qtl_user') !== -1 || o.indexOf('//p.qpic.cn/qtlinfo') !== -1) {
                    o += logoSizeParam;
                }
            }
            return o;
        }

        if (typeof(o) === 'object') {
            for (var i = 0, j = o.length; i < j; ++i) {
                var obj = o[i];
                var logoUrl = obj.logo_url;
                if (!cimi.judgeEndStr(logoUrl, logoSizeParam)) {
                    if (logoUrl.indexOf('qtl_user') !== -1 || logoUrl.indexOf('//p.qpic.cn/qtlinfo') !== -1) {
                        logoUrl += logoSizeParam;
                    }
                    obj.logo_url = logoUrl;
                }
            }
            return o;
        }
    },
    //��ȡ��ע�б�
    requestFollowList: function(loadMore) {
        var timeParam = '&start_time=' + CommonFunc.myFollowData.createTime;
        // if (loadMore) {
        //     timeParam = '&start='+CommonFunc.myFollowData.createTime+'&last_req_time='+CommonFunc.myFollowData.lastRequestTime;
        // }
        var goUrl = CommonFunc.apiWeGame + 'GetFollowList?use=zm&query_count=true&num=20&start=0' + timeParam;
        if (CommonFunc.gGuestId) {
            goUrl += '&uuid=' + CommonFunc.gGuestId;
        }
        $('#myFollowListLoadMoreButton').show().removeAttr('href').text('������...');
        new RequestApi({
            apiUrl: goUrl,
            data: {
                xhrFields: {
                    withCredentials: true
                }
            },
            successBack: function(data) {
                if (data.code === 0) {
                    if (JSON.stringify(data.res.attenion_list) !== '{}') {
                        var dataList = data.res.attenion_list;
                        if (loadMore) {
                            CommonFunc.myFollowData.list = CommonFunc.myFollowData.list.concat(dataList);
                        } else {
                            CommonFunc.myFollowData.list = dataList;
                        }
                        CommonFunc.myFollowData.list = CommonFunc.parseLogoUrl(CommonFunc.myFollowData.list);
                        CommonFunc.mergeFansStatusData(dataList, function(result) {
                            if (loadMore) {
                                CommonFunc.myFollowData.status = $.extend(CommonFunc.myFollowData.status, result.status);
                            } else {
                                CommonFunc.myFollowData.status = result.status;
                            }
                            CommonFunc.myFollowData.selfUuid = result.selfUuid;
                            $('#myFollowList').html(template('tpl_my_follow_list', CommonFunc.myFollowData));
                            if (data.res.is_finish) {
                                $('#myFollowListLoadMoreButton').text('�������');
                            } else {
                                $('#myFollowListLoadMoreButton').attr('href', 'javascript:CommonFunc.requestFollowList(true)').text('���ظ���');
                            }
                            CommonFunc.myFollowData.createTime = dataList[dataList.length - 1].create_time;
                            // CommonFunc.myFollowData.lastRequestTime = data.res.last_req_time;
                        });
                        $('#followNum').text(data.res.total_num);
                    } else {
                        $('#followNum').text(0);
                    }
                    // getFollowCallback && getFollowCallback();
                }
            },
            failBack: function() {

            }
        });
    },
    //��ȡ��˿�б�
    requestFanList: function(loadMore) {
        var timeParam = '&start_time=' + CommonFunc.myFansData.createTime;
        if (loadMore) {
            timeParam = '&start_time=' + CommonFunc.myFansData.createTime + '&last_req_time=' + CommonFunc.myFansData.lastRequestTime;
        }
        var goUrl = CommonFunc.apiWeGame + 'GetFanList?use=zm&query_count=true&num=20' + timeParam;
        if (CommonFunc.gGuestId) {
            goUrl += '&uuid=' + CommonFunc.gGuestId;
        }
        $('#myFanListLoadMoreButton').show().removeAttr('href').text('������...');
        new RequestApi({
            apiUrl: goUrl,
            data: {
                xhrFields: {
                    withCredentials: true
                }
            },
            successBack: function(data) {
                if (data.code === 0) {
                    if (JSON.stringify(data.res.fans_list) !== '{}') {
                        if (loadMore) {
                            CommonFunc.myFansData.list = CommonFunc.myFansData.list.concat(data.res.fans_list);
                        } else {
                            CommonFunc.myFansData.list = data.res.fans_list;
                        }
                        CommonFunc.myFansData.list = CommonFunc.parseLogoUrl(CommonFunc.myFansData.list);
                        CommonFunc.mergeFansStatusData(data.res.fans_list, function(result) {
                            if (loadMore) {
                                CommonFunc.myFansData.status = $.extend(CommonFunc.myFansData.status, result.status);
                            } else {
                                CommonFunc.myFansData.status = result.status;
                            }
                            CommonFunc.myFansData.selfUuid = result.selfUuid;
                            $('#myFansList').html(template('tpl_my_fans_list', CommonFunc.myFansData));
                            if (data.res.is_finish) {
                                $('#myFanListLoadMoreButton').text('�������');
                            } else {
                                $('#myFanListLoadMoreButton').attr('href', 'javascript:CommonFunc.requestFanList(true)').text('���ظ���');
                            }
                            CommonFunc.myFansData.createTime = data.res.fans_list[data.res.fans_list.length - 1].create_time;
                            CommonFunc.myFansData.lastRequestTime = data.res.last_req_time;
                            //��ҳ
                            // CommonFunc.pageCtrl('myFanListPageCtrl', CommonFunc.myFanListPage, Math.ceil(data.res.total_num/50), function (i) {
                            //     CommonFunc.myFanListPage = i;
                            //     CommonFunc.requestFollowList();
                            // });
                        });
                        //���·�˿
                        if (data.res.new_num_curpage > 0) {
                            $('#fansNum').addClass('new');
                        }
                        $('#fansNum').text(cimi.getCnCount(data.res.total_num));
                    } else {
                        $('#fansNum').text(0);
                    }
                }
            },
            failBack: function() {

            }
        });
    },
    //��ҳ����
    /*pageCtrl: function (elmId, page, total, callback) {
        need("util.ajaxpage", function(jo) {
            pageShow = new jo({
                oPage: "pageShow",
                pageId: elmId,
                pageNow: page,
                pageShowNum: 0, // ǰ�������ʾ��ҳ��
                pageTotal: total,
                style: 345,
                onChange: function(i) {
                    callback && callback(i);
                }
            });
        });
    },*/
    //��ע/ȡ����ע����
    requestFollowOrUnfollowPlayer: function(isFollow, uuid, callback) {
        var url = isFollow ? 'FollowPlayer?use=zm&uuid=' : 'UnfollowPlayer?use=zm&uuid=';
        new RequestApi({
            apiUrl: CommonFunc.apiWeGame + url + uuid,
            data: {
                xhrFields: {
                    withCredentials: true
                }
            },
            successBack: function(data) {
                if (+data.code === 0) {
                    callback && callback();
                }
                CommonFunc.clickEnable = true;
            },
            failBack: function() {
                CommonFunc.clickEnable = true;
            }
        })
    },
    //��˿/��ע���������ע
    doFollowPlayer: function(isFollow, index, type) {
        if (!CommonFunc.clickEnable) return;
        var tmpData = type === 0 ? CommonFunc.myFansData : CommonFunc.myFollowData;
        var id = tmpData.list[index].uuid;
        CommonFunc.requestFollowOrUnfollowPlayer(isFollow, id, function() {
            if (isFollow) {
                tmpData.status[id].follow_status = 1;
                PTTSendClick('recommendFollow', 'recommendFollow-do_follow' + index, '��ע');
            } else {
                tmpData.status[id].follow_status = 0;
                PTTSendClick('recommendFollow', 'recommendFollow-do_pop_unfollow' + index, '��ע');
            }
            if (type === 0) {
                $('#myFansList').html(template('tpl_my_fans_list', tmpData));
            } else {
                $('#myFollowList').html(template('tpl_my_follow_list', tmpData));
            }
        });
    },
    //��ȡ�ҵĶ�̬�����þɵ������б�ӿڣ�
    requestDynamicInfo: function() {
        var self = CommonFunc;
        if (self.gAccountArea.length === 0) return;

        var area = self.gAccountArea;
        var todayTaskArr = [];
        var yesterdayTaskArr = [];
        //���������б�
        //var goUrl = "https://apps.game.qq.com/lol/act/a20171229personalcenter/query.php?r1=TodayObj&a1=2&area=" + area;
        var goUrl = "https://lol.sw.game.qq.com/lol/lwdcommact/v_ttzli/QueryInfo/GetTaskInfo?&r1=TodayObj&area=" + area;
        var p1 = ToolsFunc.Request(goUrl, "TodayObj");
        //���������б�
        var yesterday = ToolsFunc.DatePHP("Ymd", (new Date() - 24 * 60 * 60 * 1000) / 1000);
       // goUrl = "https://apps.game.qq.com/lol/act/a20171229personalcenter/query.php?r1=YestodayObj&a1=2&area=" + area + "&day=" + yesterday;
        goUrl = "https://lol.sw.game.qq.com/lol/lwdcommact/v_ttzli/QueryInfo/GetTaskInfo?&r1=YestodayObj&area=" + area + "&day=" + yesterday;
        var p2 = ToolsFunc.Request(goUrl, "YestodayObj");
        $.when(p1, p2).then(function(TodayObj, YestodayObj) {
            if (TodayObj.status == 0) {
                var data = JSON.parse(TodayObj.msg);
                if (data.code == 0) {
                    todayTaskArr = data.data.tasks;
                }
            }
            if (YestodayObj.status == 0) {
                var data = JSON.parse(YestodayObj.msg);
                if (data.code == 0) {
                    yesterdayTaskArr = data.data.tasks;
                }
            }
            var today_0 = new Date().setHours(0, 0, 0, 0);
            //var today_24 = new Date().setHours(23, 59, 59, 0);
            var yesterday_0 = today_0 - 24 * 60 * 60 * 1000;
            //var yesterday_24 = today_24 - 24 * 60 * 60 * 1000;
            //����
            if (todayTaskArr) {
                todayTaskArr = self.parseTaskData(todayTaskArr, true);
            }
            //����
            if (yesterdayTaskArr) {
                yesterdayTaskArr = self.parseTaskData(yesterdayTaskArr, true);
            }

            $('.d-wrap-2').show();
            //���ҳ��
            var tmpTodayDateArr = ToolsFunc.DatePHP("m.d", today_0 / 1000).split('.');
            $("#today_p").html('<span>' + tmpTodayDateArr[1] + '</span> / ' + tmpTodayDateArr[0]);
            var tmpYestodayArr = ToolsFunc.DatePHP("m.d", yesterday_0 / 1000).split('.');
            $("#yesterday_p").html('<span>' + tmpYestodayArr[1] + '</span> / ' + tmpYestodayArr[0]);

            $('#dynamicNum').text(todayTaskArr.length + yesterdayTaskArr.length);
            $("#today_dynamic_info").html(template('tpl_dynamic_list', {
                list: todayTaskArr
            }));
            $("#yesterday_dynamic_info").html(template('tpl_dynamic_list', {
                list: yesterdayTaskArr
            }));
        })
    },
    //������ȡ���߹�ע״̬����˿����
    requestFansStatus: function(uuids, callback) {
        new RequestApi({
            apiUrl: CommonFunc.apiWeGame + 'GetFansStatus?query_count=true&uuids=' + uuids,
            data: {
                xhrFields: {
                    withCredentials: true
                }
            },
            successBack: function(data) {
                if (data) {
                    callback && callback(data);
                }
            },
            failBack: function() {

            }
        })
    },
    //�������߹�ע״̬���ϲ������б�����
    mergeFansStatusData: function(list, successBack) {
        var tmpList = [];
        for (var i = 0, j = list.length; i < j; ++i) {
            if (list[i].uuid.length > 0) tmpList.push(list[i].uuid);
        }
        CommonFunc.requestFansStatus(tmpList.join(','), function(authorFansStatus) {
            successBack && successBack({
                list: list,
                status: authorFansStatus,
                selfUuid: CommonFunc.gAccountUuid
            })
        });
    },
    //��������ӿ����ݣ�onlyFinished ֻ��ʾ����ɵ�����
    parseTaskData: function(data, onlyFinished) {
        var result = [];
        for (var i = 0, j = data.length; i < j; i++) {
            var x = data[i];
            //x.parsedRemarks.action_id == 1 ��¼���� 2 �Ķ���Ѷ���� 3 ������������
            x.parsedRemarks = JSON.parse(x.remarks);
            x.parsedGiftContent = {};
            x.parsedAwardTime = ToolsFunc.DatePHP('H:i', x.awardtime / 1000);
            var tmpGiftContent = JSON.parse(x.giftcontent); //������

            for (var y in tmpGiftContent) {
                x.parsedGiftContent[y] = JSON.parse(tmpGiftContent[y]);
            }

            if (onlyFinished) {
                if (x.finished) result.push(x);
            } else {
                result.push(x);
            }
        }
        return result;
    },
    //��Ⱦ��ͼ����Ҫ�õ������ӿڵ����ݣ�
    renderPlayerBattleSummaryCharts: function(battleSummaryData, honorData) {
        var typeData = []; //����Ϸģʽ��������
        var totalWinNum = 0; //�ܾ�����ͼʤ����
        var totalLoseNum = 0; //�ܾ�����ͼ�ܳ���
        var detailData = []; //ʤ����ʤ�ʡ�MVP
        var rankNum = 0; //3����λ���ϲ���1�֡����ܳ���
        var rankWinNum = 0; //3����λ���ϲ���1�֡���ʤ��
        var matchMvpNum = honorData ? honorData.total_match_mvps : 0; //ƥ��ģʽMVP����
        var rankMvpNum = honorData ? honorData.total_rank_mvps : 0; //��λģʽMVP����
        var openDetailData = [{}, {}, {}, {}]; //���ͼ��չ���������

        if (!battleSummaryData) battleSummaryData = [];
        for (var i = 0, j = battleSummaryData.length; i < j; ++i) {
            var obj = battleSummaryData[i];
            totalWinNum += obj.win_num;
            totalLoseNum += obj.lose_num + obj.leave_num;
            if (obj.win_num + obj.lose_num + obj.leave_num > 0) {
                var name = '';
                //1.����ģʽ 2.�˻�ģʽ 3.5V5���(�������) 4.5V5����(��˫��λ) 5.3V3��� 6.���Ҷ�
                switch (obj.battle_type) {
                    case 1:
                        name = 'ƥ��ģʽ';
                        break;
                    case 2:
                        name = '�˻�ģʽ';
                        break;
                    case 3:
                        name = '�������';
                        break;
                    case 4:
                        name = '��˫��λ';
                        break;
                    case 5:
                        name = '3V3���';
                        break;
                    case 6:
                        name = '���Ҷ�';
                        break;
                }

                if (obj.battle_type === 1 || obj.battle_type === 2 || obj.battle_type === 6) {
                    typeData.push({
                        value: obj.win_num + obj.lose_num + obj.leave_num,
                        name: name
                    });

                    if (obj.battle_type === 1) {
                        var tmpObj = {
                            'total': obj.win_num + obj.lose_num + obj.leave_num,
                            'site': obj.win_num,
                            'rate': Math.round(obj.win_num / (obj.win_num + obj.lose_num + obj.leave_num) * 100) + '%',
                            'mvp': matchMvpNum
                        };
                        detailData.push(tmpObj);
                        openDetailData[3] = tmpObj;
                    } else if (obj.battle_type === 2) {
                        var tmpObj = {
                            'total': obj.win_num + obj.lose_num + obj.leave_num,
                            'site': obj.win_num,
                            'rate': Math.round(obj.win_num / (obj.win_num + obj.lose_num + obj.leave_num) * 100) + '%',
                            'mvp': '--'
                        };
                        detailData.push(tmpObj);
                        openDetailData[1] = tmpObj;
                    } else {
                        var tmpObj = {
                            'total': obj.win_num + obj.lose_num + obj.leave_num,
                            'site': obj.win_num,
                            'rate': Math.round(obj.win_num / (obj.win_num + obj.lose_num + obj.leave_num) * 100) + '%',
                            'mvp': '--'
                        };
                        detailData.push(tmpObj);
                        openDetailData[2] = tmpObj;
                    }
                } else {
                    rankNum += obj.win_num + obj.lose_num + obj.leave_num;
                    rankWinNum += obj.win_num;
                }
            }
        }
        //3����λ�ϲ�֮�������
        if (rankNum !== 0) {
            typeData.push({
                value: rankNum,
                name: '��λģʽ'
            });
            var tmpObj = {
                'total': obj.win_num + obj.lose_num + obj.leave_num,
                'site': rankWinNum,
                'rate': Math.round(rankWinNum / rankNum * 100) + '%',
                'mvp': rankMvpNum
            };
            detailData.push(tmpObj);
            openDetailData[0] = tmpObj;
        }

        var totalData = [{
            value: totalLoseNum,
            name: '�ܳ�'
        }, {
            value: totalWinNum,
            name: 'ʤ��'
        }];

        if (totalLoseNum + totalWinNum === 0) {
            return;
        }
        $('#chartsTotalNum').text(totalLoseNum + totalWinNum);
        //Ĭ����չʾ���б�����ʤ����ʤ�ʡ�MVP
        $('.site-num').text(totalWinNum);
        $('.rate-num').text(Math.round(totalWinNum / (totalWinNum + totalLoseNum) * 100) + '%');
        $('.mvp-num').text(matchMvpNum + rankMvpNum);

        var myChart = echarts.init(document.getElementById('data_surface'));
        //series[0] �ܾ��� series[1] ����ģʽ
        var option = {
            color: ['#1b273f', '#0baac0', '#d7b86f', '#285a80'],
            series: [{
                name: '',
                type: 'pie',
                // selectedMode: 'single',
                radius: ['30%', '36%'],
                label: {
                    show: false,
                    normal: {
                        position: 'inner',
                        textStyle: {
                            color: '#fff'
                        }
                    }
                },
                animation: false,
                itemStyle: {
                    normal: {
                        label: {
                            show: false //���ر�ʾ����
                        },
                        labelLine: {
                            show: false //���ر�ʾ��
                        }
                    }
                }
            }, {
                name: '',
                type: 'pie',
                radius: ['40%', '60%'],
                label: {
                    normal: {
                        formatter: ' {b|{b}��}\n{c} ��',
                        borderWidth: 1,
                        position: 'outside',
                        borderRadius: 10,
                        textStyle: {
                            color: '#fff'
                        },
                        rich: {
                            b: {
                                fontSize: 12,
                                lineHeight: 12,
                                color: '#fff'
                            }
                        }
                    }
                },
                labelLine: {
                    normal: {
                        length: 2,
                        lineStyle: {
                            color: 'rgba(255,255,255,0.4)'
                        }
                    }
                }
            }]
        };
        option.series[0].data = totalData;
        option.series[1].data = typeData;
        myChart.setOption(option);
        myChart.on('mouseover', function(params) {
            if (params.seriesIndex === 1) {
                $('.data-bg').stop().hide().fadeIn();
                $('.site-num').text(detailData[params.dataIndex].site);
                $('.rate-num').text(detailData[params.dataIndex].rate);
                $('.mvp-num').text(detailData[params.dataIndex].mvp);
            }
        });
        myChart.on('mouseout', function() {
            $('.data-bg').stop().hide().fadeIn();
            $('.site-num').text(totalWinNum);
            $('.rate-num').text(Math.round(totalWinNum / (totalWinNum + totalLoseNum) * 100) + '%');
            $('.mvp-num').text(matchMvpNum + rankMvpNum);
        });
        //�����ͼչ������Ϣ
        $('.content-right-open .data-group').each(function(i) {
            $(this).find('.data-title .num').text(openDetailData[i].total || '--');
            $(this).find('.data-bg').eq(0).find('.num').text(openDetailData[i].site || '--');
            $(this).find('.data-bg').eq(1).find('.num').text(openDetailData[i].rate || '--');
            $(this).find('.data-bg').eq(2).find('.num').text(openDetailData[i].mvp || '--');
        });
    },
    //��ȡ��λ������
    getTierText: function(obj) {
        switch (+obj.tier) {
            case 0:
                obj.extended_tier = '��ǿ����';
                obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/season_2019_challenger.png';
                break;
            case 1:
                obj.extended_tier = '����ʯ';
                obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/season_2019_diamond_' + (obj.queue + 1) + '.png';
                break;
            case 2:
                obj.extended_tier = '���󲬽�';
                obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/season_2019_platinum_' + (obj.queue + 1) + '.png';
                break;
            case 3:
                obj.extended_tier = '��ҫ�ƽ�';
                obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/season_2019_gold_' + (obj.queue + 1) + '.png';
                break;
            case 4:
                obj.extended_tier = '��������';
                obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/season_2019_silver_' + (obj.queue + 1) + '.png';
                break;
            case 5:
                obj.extended_tier = 'Ӣ�»�ͭ';
                obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/season_2019_bronze_' + (obj.queue + 1) + '.png';
                break;
            case 6:
                obj.extended_tier = '������ʦ';
                obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/season_2019_master.png';
                break;
            case 7:
                obj.extended_tier = '������ʦ';
                obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/season_2019_grandmaster.png';
                break;
            case 8:
                obj.extended_tier = '���ͺ���';
                obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/season_2019_iron_' + (obj.queue + 1) + '.png';
                break;
            default:
                obj.extended_tier = '���޶�λ';
                obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/default.png';
                break;
        }
        switch (+obj.queue) {
            case 0:
                obj.extended_queue = '��';
                break;
            case 1:
                obj.extended_queue = '��';
                break;
            case 2:
                obj.extended_queue = '��';
                break;
            case 3:
                obj.extended_queue = '��';
                break;
                // case 4:
                //     obj.extended_queue = '��';
                //     break;
            default:
                //���ߡ�������ʦ��������ʦ��û���Ӷ�λ��
                obj.extended_queue = '';
                break;
        }
        switch (+obj.battle_type) {
            case 3:
                obj.extended_battle_type = '�������5v5';
                break;
            case 4:
                obj.extended_battle_type = '��/˫��λ��';
                break;
            case 5:
                obj.extended_battle_type = '�������3v3';
                break;
        }

        return obj;
    },
    //�ж�������ת���ӣ�д�뵽parsedNewsURL���ԣ����iIsRedirectΪ1ʱ��ֱ����ת
    parseNewsDetailListData: function(data) {
        for (var i = 0, j = data.length; i < j; i++) {
            var obj = data[i];
            if (+obj.iIsRedirect === 1) {
                obj.parsedNewsURL = obj.sRedirectURL;
            } else {
                obj.parsedNewsURL = '/news/space-detail.shtml?docid=' + obj.iDocID;
            }
        }
        // console.log(data);
        return data;
    }
};
// CommonFunc.init();

