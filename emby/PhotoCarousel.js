// ==UserScript==
// @name         emby-page
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        */web/index.html
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==


(function () {
    'use strict';
    var time, play_status = false, wardSlide, start, loopnum, banners02, banners, banners01, approuter, sliderItems, slider, btnNext, btnPrevious, btnControls, imgTitles, bannersItems;
    var issessionStorage = true;//是否启用会话存储(有效期2分钟) 禁用false,启用true
    var sum_pic = 6;//显示多少张图
    /**
     * 图片类型 横幅图: Banner 背景图: Backdrop 略缩图: Thumb
     */
    var pic = "Backdrop";
    /**
     * 初始值
     *{ImageTypes: "Backdrop", EnableImageTypes: "Logo,Banner,Thumb,Backdrop", IncludeItemTypes: "Movie,Series", SortBy: "Random", Recursive: !0, ImageTypeLimit: 1, Limit: 20, Fields: "ProductionYear"}
     */
    var query = { Limit: 6, EnableImageTypes: "logo,Banner,Thumb,Backdrop", SortBy: "ProductionYear, PremiereDate, SortName", SortOrder: "Descending", EnableUserData: !1, EnableTotalRecordCount: !1 };
    // query["parentId"] = 229144;//指定媒体库 取消可注释掉
    // query["PersonIds"] = 3578;//指定演员3578
    // query["Person"] = "周星驰";
    // query["UserId"] = "fdb869f3e0934cc2aa3e3bf65b785448";//指定用户 需管理员账号或者用户本身才会显示
    delete query.SortOrder, delete query.SortBy;//随机获取媒体 取消这一行注释
    // query.SortBy = "DateCreated,SortName";//加入时间逆序 取新加入的媒体 取消这一行注释
    // query.SortBy = "CommunityRating,SortName";//评分逆序 取高评分媒体 取消这一行注释
    query.Limit = sum_pic;
    const Options = { width: 2500, adjustForPixelRatio: !1, preferThumb: !1, preferBanner: !1, preferLogo: !1, preferBackdrop: !1 };
    const logo_options = { width: 2500, adjustForPixelRatio: !1, preferThumb: !1, preferBanner: !1, preferLogo: !0, preferBackdrop: !1 };
    if (pic == "Banner") { Options.preferBanner = !0; query.ImageTypes = "Banner"; query.EnableImageTypes = "Logo,Banner,Backdrop"; } else if (pic == "Backdrop") { Options.preferBackdrop = !0; query.ImageTypes = "Backdrop"; query.EnableImageTypes = "Logo,Backdrop"; } else if (pic == "Thumb") { Options.preferThumb = !0; query.ImageTypes = "Thumb"; query.EnableImageTypes = "Logo,Thumb,Backdrop"; } else { return; }
    let storage = { set(key, val, expired) { let obj = { data: val, time: Date.now(), expired }; sessionStorage.setItem(key, JSON.stringify(obj)); }, get(key) { let val = sessionStorage.getItem(key); if (!val) { return val; } val = JSON.parse(val); if (Date.now() - val.time > val.expired) { sessionStorage.removeItem(key); return null } return val.data; }, remove(key) { sessionStorage.removeItem(key); } };
    async function init() {
        try {
            let e = document.createElement("div");
            e.setAttribute("class", "banners");
            e.innerHTML = `
                    <div class="loader"> <span></span> </div>
                    <button type="button" is="paper-icon-button-light" data-banner="btn-previous" class="arrow-slider arrow-slider--left emby-scrollbuttons-scrollbutton md-icon paper-icon-button-light"></button>
                    <button type="button" is="paper-icon-button-light" data-banner="btn-next" class="arrow-slider arrow-slider--right emby-scrollbuttons-scrollbutton md-icon paper-icon-button-light"></button>
                    <div class="controls-slider"> </div>
                    <div class="banner-slider" data-banner="slider"> </div>
                    <style>
                        @keyframes showFade {
                            0% {
                                opacity: 0;
                            }

                            100% {
                                opacity: 1;
                            }
                        }

                        @keyframes slideDown {
                            0% {
                                height: 0;
                                opacity: .5;
                            }

                            100% {
                                height: 100%;
                                opacity: 1;
                            }
                        }

                        @keyframes slideLeft {
                            0% {
                                opacity: 0;
                                transform: translate(10rem,-50%);
                            }

                            100% {
                                opacity: 1;
                                transform: translate(0,-50%);
                            }
                        }

                        @media (min-width: 50em) {
                            .banner-slider__counter {
                                background: -webkit-linear-gradient(135deg,
                                        #0eaf6d,
                                        #ff6ac6 25%,
                                        #147b96 50%,
                                        #e6d205 55%,
                                        #2cc4e0 60%,
                                        #8b2ce0 80%,
                                        #ff6384 95%,
                                        #08dfb4);
                                -webkit-text-fill-color: transparent;
                                -webkit-background-clip: text;
                                background-clip: text;
                                -webkit-background-size: 200% 100%;
                                background-size: 60% 100%;//标题文字渐变速度
                                -webkit-animation: flowCss 12s infinite linear;
                                animation: flowCss 12s infinite linear;

                            }

                            .banner-slider__counter:hover {
                                -webkit-animation: flowCss 4s infinite linear;
                                animation: flowCss 4s infinite linear;

                            }

                            .mainAnimatedPages.skinBody-withFullDrawer {
                                --banner-width: calc(100vw - 6rem - 33.15ch - 2*min(.72em,max(.48em,1.78vw)));

                            }
                            .mainAnimatedPages.skinBody-withMiniDrawer {
                                --banner-width: calc(100vw - 6rem - 10ch - 2*min(.72em,max(.48em,1.78vw)));
                            }
                            .mainAnimatedPages.skinBody-withFullDrawer .banners,
                            .mainAnimatedPages.skinBody-withMiniDrawer .banners {
                                margin-left: calc(3rem + min(.72em, max(.48em, 1.78vw)));
                            }
                        }

                        @-webkit-keyframes flowCss {
                            0% {
                                background-position: 0 0;
                            }

                            100% {
                                background-position: -400% 0;
                            }
                        }

                        @keyframes flowCss {
                            0% {
                                background-position: 0 0;
                            }

                            100% {
                                background-position: -400% 0;
                            }
                        }

                        .arrow-slider {
                            background: none;
                            color: white;
                            cursor: pointer;
                            font-size: 3rem !important;
                        }

                        .arrow-slider--left::before {
                            content: "";
                        }

                        .arrow-slider--right::before {
                            content: "";
                        }

                        .controls-slider {
                            bottom: 0;
                            position: absolute;
                            right: 0;
                            z-index: 2;
                        }

                        .controls-slider__item {
                            border: none;
                            background: none;
                            color: #8d94a1;
                        }

                        .controls-slider__item::before {
                            cursor: pointer;
                            content: "";
                            font-size: .7rem;
                        }

                        .controls-slider__item.active {
                            color: #fff;
                        }

                        .banners {
                            width: var(--banner-width);
                            border-radius: .5rem;
                            position: relative;
                            align-items: center;
                            display: flex;
                            overflow: hidden;
                            margin-left: calc(3.4% + min(.72em, max(.48em, 1.78vw)));
                        }

                        .banner-slider {
                            display: flex;
                            position: relative;
                        }

                        .banner-slider__item {
                            flex-shrink: 0;
                            padding: 0 0 0 0;
                            position: relative;
                        }

                        .banner-slider__item {
                            width: var(--banner-width);
                        }

                        @media (min-width: 50em) {
                            :root {
                                --banner-width: 92vw;
                                --banner-height: 30vmax;
                            }

                            .banner-slider__title {
                                max-width: 30vw;
                                object-fit: contain;
                                min-height: 5vw;
                                max-height: 8vw;
                                margin-left: 5vmin;
                            }
                            .banner-slider__counter {
                                font-size: 1.7rem;//桌面模式标题文字大小
                                font-weight: 600;
                            }
                            .layout-tv .banner-slider__counter {
                                font-size: 2rem;
                                font-weight: 600;
                            }
                        }

                        @media not all and (min-width: 50em) {
                            :root {
                                --banner-width: 90vw;
                                --banner-height: calc(0.4*var(--banner-width));
                            }

                            .arrow-slider {
                                display: none;
                            }

                            .banner-slider__title {
                                object-fit: contain;
                                max-width: 40vw;
                                min-height: 7.5vw;
                                max-height: 12vw;
                                margin-left: 5vmin;
                            }
                            .banner-slider__counter {
                                font-size: 1rem;//移动模式标题文字大小
                                font-weight: 600;
                            }
                            .banner-slider__counter {
                                background: -webkit-linear-gradient(135deg,
                                        #0eaf6d,
                                        #ff6ac6 25%,
                                        #147b96 50%,
                                        #e6d205 55%,
                                        #2cc4e0 60%,
                                        #8b2ce0 80%,
                                        #ff6384 95%,
                                        #08dfb4);
                                -webkit-text-fill-color: transparent;
                                -webkit-background-clip: text;
                                background-clip: text;
                                -webkit-background-size: 200% 100%;
                                background-size: 50% 100%;
                                -webkit-animation: flowCss 12s infinite linear;
                                animation: flowCss 12s infinite linear;
                            }
                        }

                        .banner-slider__counter {
                            position: absolute;
                            top: 3vmin;
                            left: 5vmin;
                            z-index: 10;
                            display: inline-block;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            width: 80vw;
                        }

                        .banner-slider__link {
                            display: block;
                            position: relative;
                        }

                        .banner-slider__link::before {
                            border: .4rem solid rgba(255, 255, 255, 0);
                            border-radius: .5rem;
                            content: "";
                            position: absolute;
                            inset: 0;
                            transition: border .3s;
                        }

                        .banner-slider__link:hover::before {
                            border-color: rgba(255, 255, 255, 0.7);
                        }

                        .banner-slider__cover {
                            border-radius: .5rem;
                            box-shadow: #000 0rem 2rem 3rem -2rem;
                            display: block;
                            width: 100%;
                            max-height: var(--banner-height);
                            object-fit: cover;
                            object-position: 50% 10%;
                            filter: brightness(90%);//背景图亮度
                        }

                        .banner-slider__title {
                            animation: slideLeft 1s;
                            left: 0;
                            display: none;
                            position: absolute;
                            top: 50%;
                            transform: translateY(-50%)
                        }

                        .banner-slider__title.active {
                            display: block;
                        }

                        .banners .arrow-slider {
                            position: absolute;
                            z-index: 2;
                            opacity: 0;
                        }

                        .banners .arrow-slider--left {
                            left: 3.6rem;
                        }

                        .banners .arrow-slider--right {
                            right: 3.6rem;
                        }

                        .banners .controls-slider {
                            bottom: 5%;
                            right: 10%;
                            white-space: nowrap;
                        }

                        .banners:hover .arrow-slider {
                            opacity: 1;
                            transition: 0.3s;
                        }
                    </style>`;
            banners = document.querySelector(".view:not(.hide) .homeSectionsContainer");
            banners && banners.parentNode.insertBefore(e, banners);
            /* banners && banners.insertBefore(e, banners.childNodes[1]); */
            let n = await window.require(["connectionManager"]);
            var apiClients;

            if (n[0].currentApiClient().connected) {
                apiClients = n[0].currentApiClient();

            } else {
                // banners.style.display = 'block';
                let thisNode = document.querySelectorAll('.view .banners');
                thisNode && thisNode.forEach(
                    function (e) {
                        e.style.display = 'none';
                        let timery;
                        if (timery) {
                            clearTimeout(timery);
                        }
                        timery = setTimeout(() => {
                            e.parentNode.removeChild(e);
                        }, 10000);

                    });
                return
            }

            await getBackdropItems(apiClients, query).then(e => e.Items).then(
                function (e) {
                    for (let t = 0, r = 0; t < e.length && r <= sum_pic - 1; ++t) {
                        let i = e[t];
                        if (i.ImageTags && i.ImageTags.Logo) {
                            r++;
                            document.querySelector(".view:not(.hide) .banners .controls-slider").innerHTML += '<button class="controls-slider__item" data-banner="btn-control"><i class="md-icon"></i></button>';
                            document.querySelector(".view:not(.hide) div.banner-slider").innerHTML += '<div class="banner-slider__item" data-banner="item"><span class="banner-slider__counter">' + i.Name + '</span><a href="#" class="banner-slider__link" itemid="' + i.Id + '"><img draggable="false"  loading="eager" decoding="async" class="banner-slider__cover" src="' + getImageUrl(i, apiClients, Options).imgUrl + '" alt="Backdrop" /><img draggable="false"  loading="auto" decoding="lazy" class="banner-slider__title" src="' + getImageUrl(i, apiClients, logo_options).imgUrl + '" data-banner="img-title" alt="Logo"/></a></div>';
                        } else {
                            r++;
                            document.querySelector(".view:not(.hide) .banners .controls-slider").innerHTML += '<button class="controls-slider__item" data-banner="btn-control"><i class="md-icon"></i></button>';
                            document.querySelector(".view:not(.hide) div.banner-slider").innerHTML += '<div class="banner-slider__item" data-banner="item"><span class="banner-slider__counter">' + i.Name + '</span><a href="#" class="banner-slider__link" itemid=' + i.Id + '><img draggable="false"  loading="eager" decoding="async" class="banner-slider__cover" src="' + getImageUrl(i, apiClients, Options).imgUrl + '" /><img style="display:none;" class="banner-slider__title" data-banner="img-title" alt="Logo"/></a></div>';
                        }
                    }
                    if (e.length == 0) {
                        bannersItems = document.querySelector(".view:not(.hide) .banners");
                        if (bannersItems) { bannersItems.style.display = 'none'; }
                    } else {
                        approuter = window.require(["appRouter"]);
                        sliderItems = document.querySelectorAll('.view:not(.hide) .banners [data-banner="item"]');
                        slider = document.querySelector('.view:not(.hide) .banners [data-banner="slider"]');
                        var firstItem = sliderItems[0].cloneNode(true);
                        var lastltem = sliderItems[sliderItems.length - 1].cloneNode(true);
                        slider.appendChild(firstItem);
                        slider.insertBefore(lastltem, sliderItems[0]);
                        sliderItems = document.querySelectorAll('.view:not(.hide) .banners [data-banner="item"]');
                        btnNext = document.querySelector('.view:not(.hide) .banners [data-banner="btn-next"]');
                        btnControls = document.querySelectorAll('.view:not(.hide) .banners [data-banner="btn-control"]');
                        btnPrevious = document.querySelector('.view:not(.hide) .banners [data-banner="btn-previous"]');
                        imgTitles = document.querySelectorAll('.view:not(.hide) .banners [data-banner="img-title"]');
                        bannersItems = document.querySelector('.view:not(.hide) .banners');
                        if (bannersItems) {
                            setVisibleSlide1(1);
                            setListeners();
                            bannersItems.style.height = 'auto';
                            document.querySelector('.view:not(.hide) .banners .loader').style.display = 'none';
                        } else {
                            let thisNode = document.querySelectorAll('.view.hide .banners');
                            thisNode && thisNode.forEach(
                                function (e) {
                                    e.parentNode.removeChild(e);
                                });
                        }

                    }
                });

        } catch (err) {
            console.warn(`error: ${err}`);
            let thisNode = document.querySelectorAll('.view .banners');
            thisNode && thisNode.forEach(
                function (e) {
                    e.style.display = 'none';
                    let timery;
                    if (timery) {
                        clearTimeout(timery);
                    }
                    timery = setTimeout(() => {
                        e.parentNode.removeChild(e);
                    }, 10000);
                });
        } finally {
            // banners.style.display = 'block';
        }
    }
    const state = { mouseDownPosition: 0, lastTranslatePosition: 0, movementPosition: 0, currentSliderPosition: 0, currentSlideIndex: 0 };
    function translateSlide(e) {
        state.lastTranslatePosition = e;
        slider.style.transform = `translatex(${e}px)`
    }
    function getCenterPosition(e) {
        let t = sliderItems[e], n = (window.innerWidth - t.offsetWidth) / 2, r = 0 - t.getBoundingClientRect().width * e;
        return r
    }
    function forwardSlide() {
        wardSlide = 1;
        state.currentSlideIndex < sliderItems.length - 2 ? setVisibleSlide(state.currentSlideIndex + 1) : setVisibleSlide(sliderItems.length - 1)
    }
    function backwardSlide() {
        wardSlide = 0;
        state.currentSlideIndex > 1 ? setVisibleSlide(state.currentSlideIndex - 1) : setVisibleSlide(sliderItems.length - 1)
    }
    function animateTransition(e) {
        e ? slider.style.transition = "transform .5s" : slider.style.removeProperty("transition")
    }
    function animateTransition7(e) {
        e ? slider.style.transition = "transform 0s" : slider.style.removeProperty("transition")
    }
    function activeControlButton(e) {
        btnControls.forEach(function (e) { e.classList.remove("active") }); let t = btnControls[e - 1]; t.classList.add("active")
    }
    function activeImageTitle(e) {
        imgTitles.forEach(function (e) { e.classList.remove("active") }); let t = imgTitles[e]; t.classList.add("active")
    }
    function setVisibleSlide(e) {

        if (e == (sliderItems.length - 1) && wardSlide == 1) {
            state.currentSlideIndex = 1;
            let t = getCenterPosition(e);
            activeControlButton(1);
            activeImageTitle(1);
            animateTransition(!0);
            translateSlide(t);
            setTimeout(function () {
                animateTransition7(!0);
                translateSlide(getCenterPosition(1));
            }, 500);


        } else if (e == (sliderItems.length - 1) && wardSlide == 0) {
            state.currentSlideIndex = e - 1;
            let t = getCenterPosition(0);
            activeControlButton(sliderItems.length - 2);
            activeImageTitle(sliderItems.length - 2);
            animateTransition(!0);
            translateSlide(t);
            setTimeout(function () {
                animateTransition7(!0);
                translateSlide(getCenterPosition(e - 1))
            }, 500);
        }
        else {
            state.currentSlideIndex = e;
            let t = getCenterPosition(e);
            activeControlButton(e);
            activeImageTitle(e);
            animateTransition(!0);
            translateSlide(t)
        }
    }
    function setVisibleSlide1(e) {
        state.currentSlideIndex = e;
        let t = getCenterPosition(e);
        activeControlButton(e);
        activeImageTitle(e);
        animateTransition7(!0);
        translateSlide(t)
    }
    function preventDefault(e) {
        e.preventDefault();
    }
    function onControlButtonClick(e, t) {
        setVisibleSlide(t)
    }
    function onMouseDown(e, t) {
        let n = e.currentTarget;
        state.mouseDownPosition = e.clientX;
        state.currentSliderPosition = e.clientX - state.lastTranslatePosition;
        state.currentSlideIndex = t;
        animateTransition(!1);
        n.addEventListener("mousemove", onMouseMove)
    }
    function onSlideClick(e) {
        let t = e.currentTarget;
        approuter.then(approuter => approuter[0].showItem(t.lastChild.getAttribute("itemid")));
    }
    function onMouseMove(e) {
        e.currentTarget, translateSlide(e.clientX - state.currentSliderPosition);
    }
    function onMouseUp(e) {
        let t = e.currentTarget;
        if (state.movementPosition = e.clientX - state.mouseDownPosition, state.movementPosition < 5 && state.movementPosition > -5) onSlideClick(e);
        else if (state.movementPosition > 150) backwardSlide();
        else if (state.movementPosition < -150) forwardSlide();
        else { let n = getCenterPosition(state.currentSlideIndex); translateSlide(n) }
        t.removeEventListener("mousemove", onMouseMove)
    }
    function onMouseLeave(e) {
        !play_status && startAtuoPlay();
        let t = e.currentTarget;
        t.removeEventListener("mousemove", onMouseMove)
    }
    function onTouchstart(e, t) {
        play_status && pausedPlay();
        let n = e.currentTarget;
        state.mouseDownPosition = e.targetTouches[0].clientX;
        state.currentSliderPosition = e.targetTouches[0].clientX - state.lastTranslatePosition;
        state.currentSlideIndex = t;
        animateTransition(!1);
        n.addEventListener("touchmove", onTouchmove)
    }
    function onTouchmove(e) {
        e.currentTarget, translateSlide(e.changedTouches[0].clientX - state.currentSliderPosition);
    }
    function onTouchend(e) {
        !play_status && startAtuoPlay();
        let t = e.currentTarget;
        if (state.movementPosition = e.changedTouches[0].clientX - state.mouseDownPosition, state.movementPosition < 5 && state.movementPosition > -5) onSlideClick(e);
        else if (state.movementPosition > 150) backwardSlide();
        else if (state.movementPosition < -150) forwardSlide();
        else { let n = getCenterPosition(state.currentSlideIndex); translateSlide(n) }
        t.removeEventListener("touchmove", onTouchmove)
    }
    function onTvSlideClick() {
        approuter.then(approuter => approuter[0].showItem(sliderItems[state.currentSlideIndex].lastChild.getAttribute("itemid")));
    }
    function onKeyUp(e) {
        if (e && e.keyCode == 37) backwardSlide();
        if (e && e.keyCode == 39) forwardSlide();
        if (e && e.keyCode == 13) onTvSlideClick();
        !play_status && startAtuoPlay();
    }

    function setListeners() {
        let istv = document.querySelector(".layout-tv");
        btnNext.addEventListener("click", forwardSlide);
        btnPrevious.addEventListener("click", backwardSlide);
        btnNext.addEventListener("mouseenter", pausedPlay);
        btnPrevious.addEventListener("mouseenter", pausedPlay);
        sliderItems.forEach(
            function (e, t) {
                let n = e.querySelector(".banner-slider__link");
                n.addEventListener("click", preventDefault);
                e.addEventListener("dragstart", preventDefault);
                e.addEventListener("mousedown", function (e) { onMouseDown(e, t) });
                e.addEventListener("mouseup", onMouseUp);
                e.addEventListener("touchstart", function (e) { onTouchstart(e, t) });
                e.addEventListener("touchend", onTouchend);
                e.addEventListener("mouseleave", onMouseLeave);
                e.addEventListener("mouseenter", pausedPlay);
                if (istv) {
                    e.addEventListener("keydown", pausedPlay);
                    e.addEventListener("keyup", onKeyUp);
                    e.addEventListener("click", onTvSlideClick);

                } else {
                    e.addEventListener("keydown", preventDefault);
                    e.addEventListener("keyup", preventDefault);
                    e.addEventListener("click", preventDefault);
                }
                t != 0 && t != (sliderItems.length - 1) && btnControls[t - 1].addEventListener("click", function (e) { onControlButtonClick(e, t) });
                t != 0 && t != (sliderItems.length - 1) && btnControls[t - 1].addEventListener("mouseenter", pausedPlay);
            }
        );
        !play_status && startAtuoPlay();
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var target = document.body;
        var observer = new MutationObserver(function () {
            banners01 = document.querySelectorAll(".view:not(.hide) .banners")[0];
            if (banners01) {
                setVisibleSlide1(state.currentSlideIndex);
            }
        });
        var config = { attributes: true };
        observer.observe(target, config);
        window.addEventListener("popstate", function () {
            banners01 = document.querySelectorAll(".view:not(.hide) .banners")[0];
            if (banners01) {
                sliderItems = document.querySelectorAll('.view:not(.hide) .banners [data-banner="item"]');
                slider = document.querySelector('.view:not(.hide) .banners [data-banner="slider"]');
                btnNext = document.querySelector('.view:not(.hide) .banners [data-banner="btn-next"]');
                btnControls = document.querySelectorAll('.view:not(.hide) .banners [data-banner="btn-control"]');
                btnPrevious = document.querySelector('.view:not(.hide) .banners [data-banner="btn-previous"]');
                imgTitles = document.querySelectorAll('.view:not(.hide) .banners [data-banner="img-title"]');
                bannersItems = document.querySelector('.view:not(.hide) .banners');
                setVisibleSlide1(state.currentSlideIndex);
                !play_status && startAtuoPlay();
            } else {
                play_status && pausedPlay();
            }
        });
        window.addEventListener('resize', cancalDebounce);
    }
    const getWindowInfo = () => {
        banners01 = document.querySelectorAll(".view:not(.hide) .banners")[0];
        if (banners01) {
            sliderItems = document.querySelectorAll('.view:not(.hide) .banners [data-banner="item"]');
            slider = document.querySelector('.view:not(.hide) .banners [data-banner="slider"]');
            btnNext = document.querySelector('.view:not(.hide) .banners [data-banner="btn-next"]');
            btnControls = document.querySelectorAll('.view:not(.hide) .banners [data-banner="btn-control"]');
            btnPrevious = document.querySelector('.view:not(.hide) .banners [data-banner="btn-previous"]');
            imgTitles = document.querySelectorAll('.view:not(.hide) .banners [data-banner="img-title"]');
            bannersItems = document.querySelector('.view:not(.hide) .banners');
            setVisibleSlide1(state.currentSlideIndex);
        }
    };
    const debounce = (fn, delay) => {
        let timer;
        return function () {
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(() => {
                fn();
            }, delay);
        }
    };
    const cancalDebounce = debounce(getWindowInfo, 50);

    function startAtuoPlay() {
        clearInterval(time);
        time = setInterval(function () {
            banners01 = document.querySelectorAll(".view:not(.hide) .banners")[0];
            if (banners01) {
                forwardSlide();
            } else {
                play_status && pausedPlay();
            }
        }, 8000);
        play_status = true;

    }
    function pausedPlay() {
        play_status && time && clearInterval(time);
        play_status = false;
    }
    async function getBackdropItems(apiClient, query) {
        query = Object.assign({
            ImageTypes: "Backdrop", EnableImageTypes: "Logo,Banner,Thumb,Backdrop", IncludeItemTypes: "Movie,Series", SortBy: "Random", Recursive: !0, ImageTypeLimit: 1, Limit: 20, Fields: "ProductionYear"
        },
            query);

        if (typeof Storage !== "undefined" && !storage.get("CACHE|Items-funny" + apiClient.getCurrentUserId())) {
            const data = JSON.stringify(await apiClient.getItems(apiClient.getCurrentUserId(), query));
            storage.set("CACHE|Items-funny" + apiClient.getCurrentUserId(), data, 2 * 60 * 1000);//会话缓存时间（2分钟）

        }
        return issessionStorage ? JSON.parse(typeof Storage !== "undefined" ? storage.get("CACHE|Items-funny" + apiClient.getCurrentUserId()) : apiClient.getItems(apiClient.getCurrentUserId(), query)) : apiClient.getItems(apiClient.getCurrentUserId(), query);

    }

    function getImageUrl(item, apiClient, options) {
        var imgUrl, width = options.width, adjustForPixelRatio = options.adjustForPixelRatio;
        if (item.ImageUrl) return imgUrl = item.ImageUrl, options.addImageSizeToUrl && options.width && (imgUrl += "&maxWidth=" + width), {
            imgUrl: imgUrl, aspect: item.PrimaryImageAspectRatio
        };
        var imageAspect, primaryImageAspectRatio = item.PrimaryImageAspectRatio, imageTags = item.ImageTags;
        return options.preferThumb && imageTags && imageTags.Thumb ? (imgUrl = apiClient.getImageUrl(item.Id, {
            type: "Thumb", maxWidth: width, tag: imageTags.Thumb, adjustForPixelRatio: adjustForPixelRatio
        })
            , imageAspect = 16 / 9) : options.preferBanner && imageTags && imageTags.Banner ? (imgUrl = apiClient.getImageUrl(item.Id, {
                type: "Banner", maxWidth: width, tag: imageTags.Banner, adjustForPixelRatio: adjustForPixelRatio
            })
                , imageAspect = 5 / 2) : options.preferLogo && imageTags && imageTags.Logo ? (imgUrl = apiClient.getImageUrl(item.Id, {
                    type: "Logo", maxWidth: width, tag: imageTags.Logo, adjustForPixelRatio: adjustForPixelRatio
                })
                    , imageAspect = 16 / 9) : options.preferLogo && item.ParentLogoImageTag && item.ParentLogoItemId ? (imgUrl = apiClient.getImageUrl(item.ParentLogoItemId, {
                        type: "Logo", maxWidth: width, tag: item.ParentLogoImageTag, adjustForPixelRatio: adjustForPixelRatio
                    })
                        , imageAspect = 16 / 9) : options.preferBackdrop && item.BackdropImageTags && item.BackdropImageTags.length ? (imgUrl = apiClient.getImageUrl(item.Id, {
                            type: "Backdrop", maxWidth: width, tag: item.BackdropImageTags[0], adjustForPixelRatio: adjustForPixelRatio
                        })
                            , imageAspect = 16 / 9) : item.BackdropImageTags && item.BackdropImageTags.length ? (imgUrl = apiClient.getImageUrl(item.Id, {
                                type: "Backdrop", maxWidth: width, tag: item.BackdropImageTags[0], adjustForPixelRatio: adjustForPixelRatio
                            })
                                , imageAspect = 16 / 9) : imageTags && imageTags.Thumb ? (imgUrl = apiClient.getImageUrl(item.Id, {
                                    type: "Thumb", maxWidth: width, tag: imageTags.Thumb, adjustForPixelRatio: adjustForPixelRatio
                                })
                                    , imageAspect = 16 / 9) : item.PrimaryImageItemId && (imgUrl = apiClient.getImageUrl(item.PrimaryImageItemId, {
                                        type: "Primary", maxWidth: width, adjustForPixelRatio: adjustForPixelRatio
                                    })
                                        , imageAspect = primaryImageAspectRatio), {
            imgUrl: imgUrl, aspect: imageAspect
        }
    }

    /*  setInterval(function () {
         banners = document.querySelectorAll(".view:not(.hide) .homeSectionsContainer")[0];
         banners01 = document.querySelectorAll(".view:not(.hide) .banners")[0];
         if (banners && !banners01) {
             play_status && pausedPlay();
             init();
         }
     }, 100); */
    /*换种加载方式，有问题的话注释下方监听，启用上方定时器*/
    document.addEventListener('viewshow', function () {
        clearInterval(start);
        loopnum = 0;
        start = setInterval(function () {
            banners = document.querySelectorAll(".view:not(.hide) .homeSectionsContainer")[0];
            banners01 = document.querySelectorAll(".view:not(.hide) .banners")[0];
            banners02 = document.querySelectorAll(".view.hide .banners")[0];
            loopnum++;

            if (loopnum > 100) {
                clearInterval(start);
            } else {
                // console.log("轮询次数", loopnum);
                if (banners && !banners01) {
                    play_status && pausedPlay();
                    init();
                    clearInterval(start);
                } else if (!banners01 && banners02) {
                    clearInterval(start);
                }
                else if (banners01) {
                    clearInterval(start);
                }
            }
        }, 10);
    }, false);

})();
