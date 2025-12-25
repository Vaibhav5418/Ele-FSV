const { TAG_UUID, TAG_GR_UUID, TAG_STREAM_CFG, TAG_TIME_CFG, TAG_EMAIL_CFG, TAG_VIDEO_CFG, TAG_DISPLAY_CFG, TAG_OSD_CFG, TAG_RECORD_CFG, TAG_IMAGE_CFG, TAG_MD_CFG, TAG_DEV_INFO, TAG_NET_INFO, TAG_VIDEO_CH011, TAG_VIDEO_CH012, TAG_VIDEO_CH013, TAG_RECORD_CH011, TAG_RECORD_CH012, TAG_RECORD_SCH, TAG_PTZ_CFG } = require("./commonConfig");

function getDefaultSettings() {
    //console.log("Before creating appSettings");
    var appSettings = {
        uuid: "",
        grUuid: "",
        "streamCfg": [
            {
                enabled: 0,
                enableAudio: 0,
                publishUrl: "",
                mqttUrl: "",
                enableTelnet: 0,
                telnetUrl: "",
                isHd: 0
            }
        ],
        "timeCfg": [
            {
                time: "",
                timeZone: "",
                tz: "",
                dstmode: 0,
                autoupdate: 0,
                autoupdatetzonvif: 0,
                ntpserver: "",
                ntpinterval: 0,
                ntpenable: 0
            }
        ],
        "emailCfg": [
            {
                emailserver: "",
                emailport: 0,
                ssl: 0,
                logintype: 0,
                emailusername: "",
                emailpassword: "",
                from: "",
                to: "",
                subject: "",
                text: "",
                attatchment: ""
            }
        ],
        "videoCh011": [
            {
                bps: 0,
                fps: 0,
                gop: 0,
                brmode: 0,
                piclevel: 0,
                fixqplevel: 0,
                width: 0,
                height: 0,
                bmainstream: 1,
                bfield: 0
            }
        ],
        "videoCh012": [
            {
                bps: 0,
                fps: 0,
                gop: 0,
                brmode: 0,
                piclevel: 0,
                fixqplevel: 0,
                width: 0,
                height: 0,
                bmainstream: 1,
                bfield: 0
            }
        ],
        "videoCh013": [
            {
                bps: 0,
                fps: 0,
                gop: 0,
                brmode: 0,
                piclevel: 0,
                fixqplevel: 0,
                width: 0,
                height: 0,
                bmainstream: 1,
                bfield: 0
            }
        ],
        "displayCfg": [
            {
                hue: 0,
                brightness: 0,
                saturation: 0,
                contrast: 0,
                ircutmode: 0
            }
        ],
        "osdCfg": [
            {
                rgncnt: 0,
                fontsize: 0,
                x_0: 0,
                y_0: 0,
                w_0: 0,
                h_0: 0,
                cont_0: "",
                show_0: 0,
                x_1: 0,
                y_1: 0,
                w_1: 0,
                h_1: 0,
                cont_1: "",
                show_1: 0
            }
        ],
        "recordCh011": [
            {
                startTimerRec: 0,
                startManualRec: 0,
                singlefiletime: 0,
                enable: 0,
                filepath: ""
            }
        ],
        "recordCh012": [
            {
                startTimerRec: 0,
                startManualRec: 0,
                singlefiletime: 0,
                enable: 0,
                filepath: ""
            }
        ],
        "recordSch": [
            {
                etm: 0,

                enWorkday: 0,
                enWeekend: 0,
                enSun: 0,
                enMon: 0,
                enTue: 0,
                enWed: 0,
                enThu: 0,
                enFri: 0,
                enSat: 0,

                workday: [],
                weekend: [],
                sun: [],
                mon: [],
                tue: [],
                wed: [],
                thu: [],
                fri: [],
                sat: []
            }
        ],
        "rectime": 0,
        "imageCfg": [
            {
                devno: 0,
                chn: 0,
                flip: 0,
                mirror: 0,
                wdr: 0
            }
        ],
        "mdCfg": [
            {
                md_email_switch: 0,
                md_snap_switch: 0,
                md_emailsnap_switch: 0,
                md_ftpsnap_switch: 0,
                md_record_switch: 0,
                md_ftprec_switch: 0,
                md_ioalmdo_switch: 0,
                etm: 0,
                workday: 0,
                weekend: 0,
                md_interval: 0,
                MdbEnable: 0,
                MdSensitiValue: 0,
                MDThresholdValue: 0,
                MdInterval: 0,
                MdRegion: [],
                md_alarm: 0,
                defend_alarm: 0,
                tc_alarm: 0
            }
        ],
        "devInfo": [
            {
                hwVer: 0,
                swVer: 0,
                provisioningVer: 0,
                publisherVer: 0,
                serialNo: ""
            }
        ],
        "nwInfo": [
            {
                networktype: "",
                macaddress: "",
                ip: "",
                netmask: "",
                gateway: "",
                sdnsip: "",
                fdnsip: ""
            }
        ]
    };


    getDefaultCfg(appSettings);

    return appSettings;
}

function VUtil_parseInt(array, start, end) {
    var i = 0;
    var j = 0;
    var retVal = 0;

    for (i = start; i < end; i++) {
        retVal |= (array[i] & 0x0FF) << (8 * j);
        j++;
    }

    return retVal;
}

function VUtil_packInt(array, offset, val) {
    array[offset++] = (val >> 0) & 0x0FF;
    array[offset++] = (val >> 8) & 0x0FF;
    array[offset++] = (val >> 16) & 0x0FF;
    array[offset++] = (val >> 24) & 0x0FF;

    return 4;
}

function VUtil_getStreamId(stream) {
    var streamId = -2;

    streamId = 0;
    for (i = 0; i < stream.length; i++) {
        streamId += stream.charCodeAt(i);
    }

    return streamId;
}

function VUtil_decodeMsgHeader(buff) {
    var msgHdr = { srcId: 0, dstId: 0, msgType: 0, msgLen: 0 };

    /* Parse srcId */
    msgHdr.srcId = VUtil_parseInt(buff, 0, 4);

    /* Parse dstId */
    msgHdr.dstId = VUtil_parseInt(buff, 4, 8);

    /* Parse msgType */
    msgHdr.msgType = VUtil_parseInt(buff, 8, 12);

    /* Parse msgLen */
    msgHdr.msgLen = VUtil_parseInt(buff, 12, 16);

    return msgHdr;
}

function VUtil_encodeMsgHeader(buff, msgHdr) {
    var offset;

    offset = 0;
    offset += VUtil_packInt(buff, offset, msgHdr.srcId);
    offset += VUtil_packInt(buff, offset, msgHdr.dstId);
    offset += VUtil_packInt(buff, offset, msgHdr.msgType);
    offset += VUtil_packInt(buff, offset, msgHdr.msgLen);

    return offset;
}

function VUtil_encodeMsg(appSettings) {
    var arrayLen;
    var i;
    var strMsg = '';

    strMsg += encodeUuid(appSettings.uuid);
    strMsg += encodeGrUuid(appSettings.grUuid);
    strMsg += encodeStreamCfg(appSettings.streamCfg);
    strMsg += encodeTimeCfg(appSettings.timeCfg);
    strMsg += encodeEmailCfg(appSettings.emailCfg);
    strMsg += encodeVideoCfg(appSettings.videoCh011, appSettings.videoCh012, appSettings.videoCh013);
    strMsg += encodeDisplayCfg(appSettings.displayCfg);
    strMsg += encodeOsdCfg(appSettings.osdCfg);
    strMsg += encodeRecordCfg(appSettings.recordCh011, appSettings.recordCh012, appSettings.recordSch, appSettings.rectime);
    strMsg += encodeImageCfg(appSettings.imageCfg);
    strMsg += encodePTZCfg(appSettings.PtzCfg);
    strMsg += encodeMdCfg(appSettings.mdCfg);
    strMsg += encodeDevInfo(appSettings.devInfo);
    strMsg += encodeNwInfo(appSettings.nwInfo);
    // strMsg += "\0";

    return strMsg;
}

function encodeUuid(uuid) {
    var msg = "";

    msg += addStartTag(TAG_UUID);
    msg += addTag("uuid", uuid);
    msg += addEndTag(TAG_UUID);

    return msg;
}

function encodeGrUuid(grUuid) {
    var msg = "";

    msg += addStartTag(TAG_GR_UUID);
    msg += addTag("grUuid", grUuid);
    msg += addEndTag(TAG_GR_UUID);

    return msg;
}

function encodeStreamCfg(cfg) {
    var msg = "";

    msg += addStartTag(TAG_STREAM_CFG);
    msg += addTag("enabled", cfg.enabled);
    msg += addTag("enableAudio", cfg.enableAudio);
    msg += addTag("publishUrl", cfg.publishUrl);
    msg += addTag("mqttUrl", cfg.mqttUrl);
    msg += addTag("enableTelnet", cfg.enableTelnet);
    msg += addTag("telnetUrl", cfg.telnetUrl);
    msg += addTag("isHd", cfg.isHd);
    msg += addTag("fwUpdtTo", cfg.fwUpdtTo)
    msg += addEndTag(TAG_STREAM_CFG);

    return msg;
}

function encodeTimeCfg(cfg) {
    var msg = "";

    msg += addStartTag(TAG_TIME_CFG);
    msg += addTag("time", cfg.time);
    msg += addTag("timeZone", cfg.timeZone);
    msg += addTag("tz", cfg.tz);
    msg += addTag("dstmode", cfg.dstmode);
    msg += addTag("autoupdate", cfg.autoupdate);
    msg += addTag("autoupdatetzonvif", cfg.autoupdatetzonvif);
    msg += addTag("ntpserver", cfg.ntpserver);
    msg += addTag("ntpinterval", cfg.ntpinterval);
    msg += addTag("ntpenable", cfg.ntpenable);
    msg += addEndTag(TAG_TIME_CFG);

    return msg;
}

function encodeTimeCfg(cfg) {
    var msg = "";

    msg += addStartTag(TAG_TIME_CFG);
    msg += addTag("time", cfg.time);
    msg += addTag("timeZone", cfg.timeZone);
    msg += addTag("tz", cfg.tz);
    msg += addTag("dstmode", cfg.dstmode);
    msg += addTag("autoupdate", cfg.autoupdate);
    msg += addTag("autoupdatetzonvif", cfg.autoupdatetzonvif);
    msg += addTag("ntpserver", cfg.ntpserver);
    msg += addTag("ntpinterval", cfg.ntpinterval);
    msg += addTag("ntpenable", cfg.ntpenable);
    msg += addEndTag(TAG_TIME_CFG);

    return msg;
}

function encodeEmailCfg(cfg) {
    var msg = "";

    msg += addStartTag(TAG_EMAIL_CFG);
    msg += addTag("emailserver", cfg.emailserver);
    msg += addTag("emailport", cfg.emailport);
    msg += addTag("ssl", cfg.ssl);
    msg += addTag("logintype", cfg.logintype);
    msg += addTag("emailusername", cfg.emailusername);
    msg += addTag("emailpassword", cfg.emailpassword);
    msg += addTag("from", cfg.from);
    msg += addTag("to", cfg.to);
    msg += addTag("subject", cfg.subject);
    msg += addTag("text", cfg.text);
    msg += addTag("attatchment", cfg.attatchment);
    msg += addEndTag(TAG_EMAIL_CFG);

    return msg;
}

function encodeVideoCfg(ch011, ch012, ch013) {
    var msg = "";

    msg += addStartTag(TAG_VIDEO_CFG);
    msg += addStartTag(TAG_VIDEO_CH011);
    msg += addTag("bps", ch011.bps);
    msg += addTag("fps", ch011.fps);
    msg += addTag("gop", ch011.gop);
    msg += addTag("brmode", ch011.brmode);
    msg += addTag("piclevel", ch011.piclevel);
    msg += addTag("fixqplevel", ch011.fixqplevel);
    msg += addTag("width", ch011.width);
    msg += addTag("height", ch011.height);
    msg += addTag("bmainstream", ch011.bmainstream);
    msg += addTag("bfield", ch011.bfield);
    msg += addEndTag(TAG_VIDEO_CH011);
    msg += addStartTag(TAG_VIDEO_CH012);
    msg += addTag("bps", ch012.bps);
    msg += addTag("fps", ch012.fps);
    msg += addTag("gop", ch012.gop);
    msg += addTag("brmode", ch012.brmode);
    msg += addTag("piclevel", ch012.piclevel);
    msg += addTag("fixqplevel", ch012.fixqplevel);
    msg += addTag("width", ch012.width);
    msg += addTag("height", ch012.height);
    msg += addTag("bmainstream", ch012.bmainstream);
    msg += addTag("bfield", ch012.bfield);
    msg += addEndTag(TAG_VIDEO_CH012);
    msg += addStartTag(TAG_VIDEO_CH013);
    msg += addTag("bps", ch013.bps);
    msg += addTag("fps", ch013.fps);
    msg += addTag("gop", ch013.gop);
    msg += addTag("brmode", ch013.brmode);
    msg += addTag("piclevel", ch013.piclevel);
    msg += addTag("fixqplevel", ch013.fixqplevel);
    msg += addTag("width", ch013.width);
    msg += addTag("height", ch013.height);
    msg += addTag("bmainstream", ch013.bmainstream);
    msg += addTag("bfield", ch013.bfield);
    msg += addEndTag(TAG_VIDEO_CH013);
    msg += addEndTag(TAG_VIDEO_CFG);

    return msg;
}

function encodeDisplayCfg(cfg) {
    var msg = "";

    msg += addStartTag(TAG_DISPLAY_CFG);
    msg += addTag("hue", cfg.hue);
    msg += addTag("brightness", cfg.brightness);
    msg += addTag("saturation", cfg.saturation);
    msg += addTag("contrast", cfg.contrast);
    msg += addTag("ircutmode", cfg.ircutmode);
    msg += addEndTag(TAG_DISPLAY_CFG);

    return msg;
}

function encodeOsdCfg(cfg) {
    var msg = "";

    msg += addStartTag(TAG_OSD_CFG);
    msg += addTag("rgncnt", cfg.rgncnt);
    msg += addTag("fontsize", cfg.fontsize);

    msg += addTag("x_0", cfg.x_0);
    msg += addTag("y_0", cfg.y_0);
    msg += addTag("w_0", cfg.w_0);
    msg += addTag("h_0", cfg.h_0);
    msg += addTag("cont_0", cfg.cont_0);
    msg += addTag("show_0", cfg.show_0);

    msg += addTag("x_1", cfg.x_1);
    msg += addTag("y_1", cfg.y_1);
    msg += addTag("w_1", cfg.w_1);
    msg += addTag("h_1", cfg.h_1);
    msg += addTag("cont_1", cfg.cont_1);
    msg += addTag("show_1", cfg.show_1);
    msg += addEndTag(TAG_OSD_CFG);

    return msg;
}

function encodeRecordCfg(ch1, ch2, recordSch, rectime) {
    var msg = "";

    msg += addStartTag(TAG_RECORD_CFG);
    msg += addStartTag(TAG_RECORD_CH011);
    msg += addTag("startTimerRec", ch1.startTimerRec);
    msg += addTag("startManualRec", ch1.startManualRec);
    msg += addTag("singlefiletime", ch1.singlefiletime);
    msg += addTag("enable", ch1.enable);
    msg += addTag("filepath", ch1.filepath);
    msg += addEndTag(TAG_RECORD_CH011);
    msg += addStartTag(TAG_RECORD_CH012);
    msg += addTag("startTimerRec", ch2.startTimerRec);
    msg += addTag("startManualRec", ch2.startManualRec);
    msg += addTag("singlefiletime", ch2.singlefiletime);
    msg += addTag("enable", ch2.enable);
    msg += addTag("filepath", ch2.filepath);
    msg += addEndTag(TAG_RECORD_CH012);
    msg += addStartTag(TAG_RECORD_SCH);
    msg += addTag("etm", recordSch.etm);
    msg += addSchArray("workday", recordSch.workday);
    msg += addSchArray("weekend", recordSch.weekend);
    msg += addSchArray("sun", recordSch.sun);
    msg += addSchArray("mon", recordSch.mon);
    msg += addSchArray("tue", recordSch.tue);
    msg += addSchArray("wed", recordSch.wed);
    msg += addSchArray("thu", recordSch.thu);
    msg += addSchArray("fri", recordSch.fri);
    msg += addSchArray("sat", recordSch.sat);
    msg += addEndTag(TAG_RECORD_SCH);
    msg += addTag("rectime", rectime);
    msg += addEndTag(TAG_RECORD_CFG);

    return msg;
}

function encodeImageCfg(cfg) {
    var msg = "";

    msg += addStartTag(TAG_IMAGE_CFG);
    msg += addTag("devno", cfg.devno);
    msg += addTag("chn", cfg.chn);
    msg += addTag("flip", cfg.flip);
    msg += addTag("mirror", cfg.mirror);
    msg += addTag("wdr", cfg.wdr);
    msg += addEndTag(TAG_IMAGE_CFG);

    return msg;
}

function encodePTZCfg(cfg) {
    var msg = "";

    msg += addStartTag(TAG_PTZ_CFG);
    msg += addTag("leftPos", cfg.leftPos);
    msg += addTag("rightPos", cfg.rightPos);
    msg += addTag("upPos", cfg.upPos);
    msg += addTag("downPos", cfg.downPos);
    msg += addTag("farPos", cfg.farPos);
    msg += addTag("nearPos", cfg.nearPos);
    msg += addTag("currPanPos", cfg.currPanPos);
    msg += addTag("currTiltPos", cfg.currTiltPos);
    msg += addTag("currZoomPos", cfg.currZoomPos);
    msg += addEndTag(TAG_PTZ_CFG);

    return msg;
}


function encodeMdCfg(cfg) {
    var index;
    var strBuff = "";
    var msg = "";

    msg += addStartTag(TAG_MD_CFG);
    msg += addTag("md_email_switch", cfg.md_email_switch);

    msg += addTag("md_snap_switch", cfg.md_snap_switch);
    msg += addTag("md_emailsnap_switch", cfg.md_emailsnap_switch);
    msg += addTag("md_ftpsnap_switch", cfg.md_ftpsnap_switch);

    msg += addTag("md_record_switch", cfg.md_record_switch);
    msg += addTag("md_ftprec_switch", cfg.md_ftprec_switch);

    msg += addTag("md_ioalmdo_switch", cfg.md_ioalmdo_switch);

    msg += addTag("etm", cfg.etm);
    msg += addTag("workday", cfg.workday);
    msg += addTag("weekend", cfg.weekend);
    msg += addTag("md_interval", cfg.md_interval);

    msg += addTag("MdbEnable", cfg.MdbEnable);
    msg += addTag("MdSensitiValue", cfg.MdSensitiValue);
    msg += addTag("MDThresholdValue", cfg.MDThresholdValue);
    msg += addTag("MdInterval", cfg.MdInterval);

    for (index = 0; index < 32; index++) {
        strBuff = "MdRegion[" + index + "]";
        msg += addTag(strBuff, cfg.MdRegion[index]);
    }

    msg += addTag("md_alarm", cfg.md_alarm);
    msg += addTag("defend_alarm", cfg.defend_alarm);
    msg += addTag("tc_alarm", cfg.tc_alarm);
    msg += addEndTag(TAG_MD_CFG);

    return msg;
}

function encodeDevInfo(cfg) {
    var msg = "";

    msg += addStartTag(TAG_DEV_INFO);
    msg += addTag("hwVer", cfg.hwVer);
    msg += addTag("swVer", cfg.swVer);
    msg += addTag("provisioningVer", cfg.provisioningVer);
    msg += addTag("publisherVer", cfg.publisherVer);
    msg += addTag("serialNo", cfg.serialNo);
    msg += addEndTag(TAG_DEV_INFO);

    return msg;
}

function encodeNwInfo(cfg) {
    var msg = "";

    msg += addStartTag(TAG_NET_INFO);
    msg += addTag("networktype", cfg.networktype);
    msg += addTag("macaddress", cfg.macaddress);
    msg += addTag("ip", cfg.ip);
    msg += addTag("netmask", cfg.netmask);
    msg += addTag("gateway", cfg.gateway);
    msg += addTag("sdnsip", cfg.sdnsip);
    msg += addTag("fdnsip", cfg.fdnsip);
    msg += addEndTag(TAG_NET_INFO);

    return msg;
}

function addStartTag(tag) {
    var msg;
    msg = "<" + tag + ">\n";
    return msg;
}

function addTag(tag, value) {
    var str;
    str = "<var " + tag + "=\"" + value + "\"/>\n";
    return str;
}


function addSchArray(tag, sch) {
    var str;

    str = "<var " + tag + "=\"" +
        sch[0] + "~" + sch[1] + "," +
        sch[2] + "~" + sch[3] + "," +
        sch[4] + "~" + sch[5] + "," +
        "\"/>\n";

    return str;
}

function addEndTag(tag) {
    var msg = "";
    msg = "</" + tag + ">\n";
    return msg;
}

function VUtil_decodeStatusMsg(buff, offset, len) {
    var i;
    var clientStats = [];

    var name;
    var isUp;
    var msg;
    var clients;

    msg = VUtil_getStringFromBuff(buff, offset, len);
    clients = msg.split("\n");
    for (i = 0; i < clients.length; i++) {
        clientStats[i] = VUtil_parseStatLine(clients[i]);
    }

    return clientStats;
}

function VUtil_decodeGetConfigMsg(buff, offset, len) {
    let appSettings = {
        uuid: "", // Set your desired values here
        grUuid: "",
        streamCfg: {
            enabled: 0,
            enableAudio: 0,
            enableTelnet: 0,
            isHd: 0,
            publishUrl: "",
            mqttUrl: "",
            telnetUrl: "",
            fwUpdtTo: "a0"
        },
        timeCfg: {
            dstmode: 0,
            autoupdate: 0,
            autoupdatetzonvif: 0,
            ntpinterval: 0,
            ntpenable: 0,
            time: "",
            timeZone: "",
            tz: "",
            ntpserver: ""
        },
        emailCfg: {
            emailserver: "",
            emailusername: "",
            emailpassword: "",
            from: "",
            to: "",
            subject: "",
            text: "",
            attatchment: "",
            emailport: 0,
            ssl: 0,
            logintype: 0
        },
        videoCh011: {
            bps: 0,
            fps: 0,
            gop: 0,
            brmode: 0,
            piclevel: 0,
            fixqplevel: 0,
            width: 0,
            height: 0,
            bmainstream: 0,
            bfield: 0
        },
        videoCh012: {
            bps: 0,
            fps: 0,
            gop: 0,
            brmode: 0,
            piclevel: 0,
            fixqplevel: 0,
            width: 0,
            height: 0,
            bmainstream: 0,
            bfield: 0
        },
        videoCh013: {
            bps: 0,
            fps: 0,
            gop: 0,
            brmode: 0,
            piclevel: 0,
            fixqplevel: 0,
            width: 0,
            height: 0,
            bmainstream: 0,
            bfield: 0
        },
        displayCfg: {
            hue: 0,
            brightness: 0,
            saturation: 0,
            contrast: 0,
            ircutmode: 0
        },
        osdCfg: {
            rgncnt: 0,
            fontsize: 0,
            x_0: 0,
            y_0: 0,
            w_0: 0,
            h_0: 0,
            cont_0: "",
            show_0: 0,
            x_1: 0,
            y_1: 0,
            w_1: 0,
            h_1: 0,
            cont_1: "",
            show_1: 0
        },
        recordCh011: {
            startTimerRec: 0,
            startManualRec: 0,
            singlefiletime: 0,
            enable: 0,
            filepath: ""
        },
        recordCh012: {
            startTimerRec: 0,
            startManualRec: 0,
            singlefiletime: 0,
            enable: 0,
            filepath: ""
        },
        recordSch: {
            etm: 0,
            enWorkday: 0,
            enWeekend: 0,
            enSun: 0,
            enMon: 0,
            enTue: 0,
            enWed: 0,
            enThu: 0,
            enFri: 0,
            enSat: 0,
            workday: [],
            weekend: [],
            sun: [],
            mon: [],
            tue: [],
            wed: [],
            thu: [],
            fri: [],
            sat: []
        },
        imageCfg: {
            devno: 0,
            chn: 0,
            flip: 0,
            mirror: 0,
            wdr: 0
        },
        mdCfg: {
            md_email_switch: 0,
            md_snap_switch: 0,
            md_emailsnap_switch: 0,
            md_ftpsnap_switch: 0,
            md_record_switch: 0,
            md_ftprec_switch: 0,
            md_ioalmdo_switch: 0,
            etm: 0,
            workday: 0,
            weekend: 0,
            md_interval: 0,
            MdbEnable: 0,
            MdSensitiValue: 0,
            MDThresholdValue: 0,
            MdInterval: 0,
            MdRegion: [],
            md_alarm: 0,
            defend_alarm: 0,
            tc_alarm: 0
        },
        devInfo: {
            hwVer: 0,
            swVer: 0,
            provisioningVer: 0,
            publisherVer: 0,
            serialNo: "",
            sdStatus: "",
            sdSize: 0,
            sdleftSize: 0
        },
        nwInfo: {
            networktype: "",
            macaddress: "",
            ip: "",
            netmask: "",
            gateway: "",
            sdnsip: "",
            fdnsip: ""
        },
        PtzCfg: {
            leftPos: 0,
            rightPos: 0,
            upPos: 0,
            downPos: 0,
            farPos: 0,
            nearPos: 0,
            currPanPos: 0,
            currTiltPos: 0,
            currZoomPos: 0
        }
    };


    var msg;
    var lines = [];
    var offset;
    var lineCnt;
    var line;


    getDefaultCfg(appSettings);

    appSettings.recordSch.workday = new Array(-1, -1, -1, -1, -1, -1);
    appSettings.recordSch.weekend = new Array(-1, -1, -1, -1, -1, -1);

    appSettings.recordSch.sun = new Array(-1, -1, -1, -1, -1, -1);
    appSettings.recordSch.mon = new Array(-1, -1, -1, -1, -1, -1);
    appSettings.recordSch.tue = new Array(-1, -1, -1, -1, -1, -1);
    appSettings.recordSch.wed = new Array(-1, -1, -1, -1, -1, -1);
    appSettings.recordSch.thu = new Array(-1, -1, -1, -1, -1, -1);
    appSettings.recordSch.fri = new Array(-1, -1, -1, -1, -1, -1);
    appSettings.recordSch.sat = new Array(-1, -1, -1, -1, -1, -1);

    appSettings.mdCfg.MdRegion = new Array(255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255);

    msg = VUtil_getStringFromBuff(buff, offset, len);
    console.log("XML Decode Msg");
    console.log(msg);
    lines = msg.split("\n");

    offset = 0;
    lineCnt = lines.length;
    while (offset < lineCnt) {
        line = lines[offset];
        //console.log(">>>>>>>>>>>>> Line : " + line);

        if (line.indexOf(TAG_GR_UUID) > 0) {
            offset++;
            offset = decodeGrUuid(lines, offset, appSettings);
        } else if (line.indexOf(TAG_UUID) > 0) {
            offset++;
            offset = decodeUuid(lines, offset, appSettings);
        } else if (line.indexOf(TAG_STREAM_CFG) > 0) {
            offset++;
            offset = decodeStreamCfg(lines, offset, appSettings.streamCfg);
        } else if (line.indexOf(TAG_TIME_CFG) > 0) {
            offset++;
            offset = decodeTimeCfg(lines, offset, appSettings.timeCfg);
        } else if (line.indexOf(TAG_EMAIL_CFG) > 0) {
            offset++;
            offset = decodeEmailCfg(lines, offset, appSettings.emailCfg);
        } else if (line.indexOf(TAG_VIDEO_CFG) > 0) {
            offset++;
            offset = decodeVideoCfg(lines, offset, appSettings);
        } else if (line.indexOf(TAG_DISPLAY_CFG) > 0) {
            offset++;
            offset = decodeDisplayCfg(lines, offset, appSettings.displayCfg);
        } else if (line.indexOf(TAG_OSD_CFG) > 0) {
            offset++;
            offset = decodeOsdCfg(lines, offset, appSettings.osdCfg);
        } else if (line.indexOf(TAG_RECORD_CFG) > 0) {
            offset++;
            offset = decodeRecordCfg(lines, offset, appSettings);
        } else if (line.indexOf(TAG_IMAGE_CFG) > 0) {
            offset++;
            offset = decodeImageCfg(lines, offset, appSettings.imageCfg);
        } else if (line.indexOf(TAG_PTZ_CFG) > 0) {
            offset++;
            offset = decodePtzCfg(lines, offset, appSettings.PtzCfg);
        }
        else if (line.indexOf() > 0) {
            offset++;
            offset = decodeImageCfg(lines, offset, appSettings.imageCfg);
        }
        else if (line.indexOf(TAG_MD_CFG) > 0) {
            offset++;
            offset = decodeMdCfg(lines, offset, appSettings.mdCfg);
        } else if (line.indexOf(TAG_DEV_INFO) > 0) {
            offset++;
            offset = decodeDevInfo(lines, offset, appSettings.devInfo);
        } else if (line.indexOf(TAG_NET_INFO) > 0) {
            offset++;
            offset = decodeNetInfo(lines, offset, appSettings.nwInfo);
        } else {
            console.log("Unknown Line : " + line);
            offset++;
        }
    }

    printConfig(appSettings);


    return appSettings;
}

function decodeUuid(lines, offset, appSetting) {
    var exitFlag;
    var line;
    var endTag;


    endTag = "</" + TAG_UUID + ">";
    exitFlag = 0;
    while (0 == exitFlag) {
        line = lines[offset];


        if (line.indexOf("uuid=") > 0) {
            appSetting.uuid = parseStringTag(line, "<var uuid=\"");
        } else if (line.indexOf(endTag) == 0) {
            exitFlag = 1;
        } else {
            console.log("decodeUuid Unknown Line : " + line);
        }

        offset++;
    }

    return offset;
}

function decodeGrUuid(lines, offset, appSetting) {
    var exitFlag;
    var line;
    var endTag;


    endTag = "</" + TAG_GR_UUID + ">";
    exitFlag = 0;
    while (0 == exitFlag) {
        line = lines[offset];


        if (line.indexOf("grUuid=") > 0) {
            appSetting.grUuid = parseStringTag(line, "<var grUuid=\"");
        } else if (line.indexOf(endTag) == 0) {
            exitFlag = 1;
        } else {
            console.log("decodeGrUuid Unknown Line : " + line);
        }

        offset++;
    }

    return offset;
}

function decodeStreamCfg(lines, offset, cfg) {
    var exitFlag;
    var line;
    var endTag;


    endTag = "</" + TAG_STREAM_CFG + ">";
    exitFlag = 0;
    while (0 == exitFlag) {
        line = lines[offset];


        if (line.indexOf("enabled=") > 0) {
            cfg.enabled = parseIntTag(line, "<var enabled=\"");
        } else if (line.indexOf("enableAudio=") > 0) {
            cfg.enableAudio = parseIntTag(line, "<var enableAudio=\"");
        } else if (line.indexOf("publishUrl=") > 0) {
            cfg.publishUrl = parseStringTag(line, "<var publishUrl=\"");
        } else if (line.indexOf("mqttUrl=") > 0) {
            cfg.mqttUrl = parseStringTag(line, "<var mqttUrl=\"");
        } else if (line.indexOf("enableTelnet=") > 0) {
            cfg.enableTelnet = parseIntTag(line, "<var enableTelnet=\"");
        } else if (line.indexOf("telnetUrl=") > 0) {
            cfg.telnetUrl = parseStringTag(line, "<var telnetUrl=\"");
        } else if (line.indexOf("isHd=") > 0) {
            cfg.isHd = parseStringTag(line, "<var isHd=\"");
        } else if (line.indexOf(endTag) == 0) {
            exitFlag = 1;
        } else {
            console.log("decodeStreamCfg Unknown Line : " + line);
        }

        offset++;
    }

    return offset;
}

function decodeTimeCfg(lines, offset, cfg) {
    var exitFlag;
    var line;
    var endTag;


    endTag = "</" + TAG_TIME_CFG + ">";
    exitFlag = 0;
    while (0 == exitFlag) {
        line = lines[offset];


        if (line.indexOf("time=") > 0) {
            cfg.time = parseStringTag(line, "<var time=\"");
        } else if (line.indexOf("timeZone=") > 0) {
            cfg.timeZone = parseStringTag(line, "<var timeZone=\"");
        } else if (line.indexOf("tz=") > 0) {
            cfg.tz = parseStringTag(line, "<var tz=\"");
        } else if (line.indexOf("dstmode=") > 0) {
            cfg.dstmode = parseIntTag(line, "<var dstmode=\"");
        } else if (line.indexOf("autoupdate=") > 0) {
            cfg.autoupdate = parseIntTag(line, "<var autoupdate=\"");
        } else if (line.indexOf("autoupdatetzonvif=") > 0) {
            cfg.autoupdatetzonvif = parseIntTag(line, "<var autoupdatetzonvif=\"");
        } else if (line.indexOf("ntpserver=") > 0) {
            cfg.ntpserver = parseStringTag(line, "<var ntpserver=\"");
        } else if (line.indexOf("ntpinterval=") > 0) {
            cfg.ntpinterval = parseIntTag(line, "<var ntpinterval=\"");
        } else if (line.indexOf("ntpenable=") > 0) {
            cfg.ntpenable = parseIntTag(line, "<var ntpenable=\"");
        } else if (line.indexOf(endTag) == 0) {
            exitFlag = 1;
        } else {
            console.log("decodeTimeCfg Unknown Line : " + line);
        }

        offset++;
    }

    return offset;
}

function decodeEmailCfg(lines, offset, cfg) {
    var exitFlag;
    var line;
    var endTag;

    endTag = "</" + TAG_EMAIL_CFG + ">";
    exitFlag = 0;
    while (0 == exitFlag) {
        line = lines[offset];


        if (line.indexOf("emailserver=") > 0) {
            cfg.emailserver = parseStringTag(line, "<var emailserver=\"");
        } else if (line.indexOf("emailport=") > 0) {
            cfg.emailport = parseIntTag(line, "<var emailport=\"");
        } else if (line.indexOf("ssl=") > 0) {
            cfg.ssl = parseIntTag(line, "<var ssl=\"");
        } else if (line.indexOf("logintype=") > 0) {
            cfg.logintype = parseIntTag(line, "<var logintype=\"");
        } else if (line.indexOf("emailusername=") > 0) {
            cfg.emailusername = parseStringTag(line, "<var emailusername=\"");
        } else if (line.indexOf("emailpassword=") > 0) {
            cfg.emailpassword = parseStringTag(line, "<var emailpassword=\"");
        } else if (line.indexOf("from=") > 0) {
            cfg.from = parseStringTag(line, "<var from=\"");
        } else if (line.indexOf("to=") > 0) {
            cfg.to = parseStringTag(line, "<var to=\"");
        } else if (line.indexOf("subject=") > 0) {
            cfg.subject = parseStringTag(line, "<var subject=\"");
        } else if (line.indexOf("text=") > 0) {
            cfg.text = parseStringTag(line, "<var text=\"");
        } else if (line.indexOf("attatchment=") > 0) {
            cfg.attatchment = parseStringTag(line, "var attatchment=\"");
        } else if (line.indexOf(endTag) == 0) {
            exitFlag = 1;
        } else {
            console.log("decodeEmailCfg Unknown Line : " + line);
        }

        offset++;
    }

    return offset;
}

function decodeVideoCfg(lines, offset, cfg) {
    var exitFlag;
    var line;
    var endTag;


    endTag = "</" + TAG_VIDEO_CFG + ">";
    exitFlag = 0;
    while (0 == exitFlag) {
        line = lines[offset];


        if (line.indexOf(TAG_VIDEO_CH011) > 0) {
            offset++;
            offset = decodeVideoChCfg(lines, offset, cfg.videoCh011, 11);
        } else if (line.indexOf(TAG_VIDEO_CH012) > 0) {
            offset++;
            offset = decodeVideoChCfg(lines, offset, cfg.videoCh012, 12);
        } else if (line.indexOf(TAG_VIDEO_CH013) > 0) {
            offset++;
            offset = decodeVideoChCfg(lines, offset, cfg.videoCh013, 13);
        } else if (line.indexOf(endTag) == 0) {
            exitFlag = 1;
            offset++;
        } else {
            console.log("decodeVideoCfg Unknown Line : " + line);
            offset++;
        }
    }

    return offset;
}

function decodeVideoChCfg(lines, offset, cfg, ch) {
    var exitFlag;
    var line;
    var endTag;


    if (11 == ch) {
        endTag = "</" + TAG_VIDEO_CH011 + ">";
    } else if (12 == ch) {
        endTag = "</" + TAG_VIDEO_CH012 + ">";
    } else if (13 == ch) {
        endTag = "</" + TAG_VIDEO_CH013 + ">";
    } else {
        console.log("Failed to decode Video Ch Cfg : " + ch);
        return 0;
    }

    exitFlag = 0;
    while (0 == exitFlag) {
        line = lines[offset];


        if (line.indexOf("bps=") > 0) {
            cfg.bps = parseIntTag(line, "<var bps=\"");
        } else if (line.indexOf("fps=") > 0) {
            cfg.fps = parseIntTag(line, "<var fps=\"");
        } else if (line.indexOf("gop=") > 0) {
            cfg.gop = parseIntTag(line, "<var gop=\"");
        } else if (line.indexOf("brmode=") > 0) {
            cfg.brmode = parseIntTag(line, "<var brmode=\"");
        } else if (line.indexOf("piclevel=") > 0) {
            cfg.piclevel = parseIntTag(line, "<var piclevel=\"");
        } else if (line.indexOf("fixqplevel=") > 0) {
            cfg.fixqplevel = parseIntTag(line, "<var fixqplevel=\"");
        } else if (line.indexOf("width=") > 0) {
            cfg.width = parseIntTag(line, "<var width=\"");
        } else if (line.indexOf("height=") > 0) {
            cfg.height = parseIntTag(line, "<var height=\"");
        } else if (line.indexOf("bmainstream=") > 0) {
            cfg.bmainstream = parseIntTag(line, "<var bmainstream=\"");
        } else if (line.indexOf("bfield=") > 0) {
            cfg.bfield = parseIntTag(line, "<var bfield=\"");
        } else if (line.indexOf(endTag) == 0) {
            exitFlag = 1;
        } else {
            console.log("decodeVideoChCfg Unknown Line : " + line);
        }

        offset++;
    }

    return offset;
}

function decodeDisplayCfg(lines, offset, cfg) {
    var exitFlag;
    var line;
    var endTag;

    endTag = "</" + TAG_DISPLAY_CFG + ">";
    exitFlag = 0;
    while (0 == exitFlag) {
        line = lines[offset];


        if (line.indexOf("hue=") > 0) {
            cfg.hue = parseIntTag(line, "<var hue=\"");
        } else if (line.indexOf("brightness=") > 0) {
            cfg.brightness = parseIntTag(line, "<var brightness=\"");
        } else if (line.indexOf("saturation=") > 0) {
            cfg.saturation = parseIntTag(line, "<var saturation=\"");
        } else if (line.indexOf("contrast=") > 0) {
            cfg.contrast = parseIntTag(line, "<var contrast=\"");
        } else if (line.indexOf("ircutmode=") > 0) {
            cfg.ircutmode = parseIntTag(line, "<var ircutmode=\"");
        } else if (line.indexOf(endTag) == 0) {
            exitFlag = 1;
        } else {
            console.log("decodeDisplayCfg Unknown Line : " + line);
        }

        offset++;
    }

    return offset;
}

function decodeOsdCfg(lines, offset, cfg) {
    var exitFlag;
    var line;
    var endTag;

    endTag = "</" + TAG_OSD_CFG + ">";
    exitFlag = 0;
    while (0 == exitFlag) {
        line = lines[offset];


        if (line.indexOf("rgncnt=") > 0) {
            cfg.rgncnt = parseIntTag(line, "<var rgncnt=\"");
        } else if (line.indexOf("fontsize=") > 0) {
            cfg.fontsize = parseIntTag(line, "<var fontsize=\"");
        } else if (line.indexOf("show_0=") > 0) {
            cfg.show_0 = parseIntTag(line, "<var show_0=\"");
        } else if (line.indexOf("x_0=") > 0) {
            cfg.x_0 = parseIntTag(line, "<var x_0=\"");
        } else if (line.indexOf("y_0=") > 0) {
            cfg.y_0 = parseIntTag(line, "<var y_0=\"");
        } else if (line.indexOf("w_0=") > 0) {
            cfg.w_0 = parseIntTag(line, "<var w_0=\"");
        } else if (line.indexOf("h_0=") > 0) {
            cfg.h_0 = parseIntTag(line, "<var h_0=\"");
        } else if (line.indexOf("cont_0=") > 0) {
            cfg.cont_0 = parseStringTag(line, "cont_0=\"");
        } else if (line.indexOf("show_1=") > 0) {
            cfg.show_1 = parseIntTag(line, "<var show_1=\"");
        } else if (line.indexOf("x_1=") > 0) {
            cfg.x_1 = parseIntTag(line, "<var x_1=\"");
        } else if (line.indexOf("y_1=") > 0) {
            cfg.y_1 = parseIntTag(line, "<var y_1=\"");
        } else if (line.indexOf("w_1=") > 0) {
            cfg.w_1 = parseIntTag(line, "<var w_1=\"");
        } else if (line.indexOf("h_1=") > 0) {
            cfg.h_1 = parseIntTag(line, "<var h_1=\"");
        } else if (line.indexOf("cont_1=") > 0) {
            cfg.cont_1 = parseStringTag(line, "cont_1=\"");
        } else if (line.indexOf(endTag) == 0) {
            exitFlag = 1;
        } else {
            console.log("decodeOsdCfg Unknown Line : " + line);
        }

        offset++;
    }

    return offset;
}

function decodeRecordCfg(lines, offset, cfg) {
    var exitFlag;

    var line;
    var endTag;


    endTag = "</" + TAG_RECORD_CFG + ">";
    exitFlag = 0;
    while (0 == exitFlag) {
        line = lines[offset];


        if (line.indexOf(TAG_RECORD_CH011) > 0) {
            offset++;
            offset = decodeRecordChCfg(lines, offset, cfg.recordCh011, 11);
        } else if (line.indexOf(TAG_RECORD_CH012) > 0) {
            offset++;
            offset = decodeRecordChCfg(lines, offset, cfg.recordCh012, 12);
        } else if (line.indexOf(TAG_RECORD_SCH) > 0) {
            offset++;
            offset = decodeRecordSchCfg(lines, offset, cfg.recordSch);
        } else if (line.indexOf("rectime=") > 0) {
            cfg.rectime = parseIntTag(line, "<var rectime=\"");
            offset++;
        } else if (line.indexOf(endTag) == 0) {
            exitFlag = 1;
            offset++;
        } else {
            console.log("decodeRecordCfg Unknown Line : " + line);
            offset++;
        }
    }

    return offset;
}

function decodeRecordChCfg(lines, offset, cfg, ch) {
    var exitFlag;
    var line;
    var endTag;


    if (11 == ch) {
        endTag = "</" + TAG_RECORD_CH011 + ">";
    } else if (12 == ch) {
        endTag = "</" + TAG_RECORD_CH012 + ">";
    } else {
        console.log("Failed to decode Record Ch Cfg : " + ch);
        return 0;
    }


    exitFlag = 0;
    while (0 == exitFlag) {
        line = lines[offset];


        if (line.indexOf("startTimerRec=") > 0) {
            cfg.startTimerRec = parseIntTag(line, "<var startTimerRec=\"");
        } else if (line.indexOf("startManualRec=") > 0) {
            cfg.startManualRec = parseIntTag(line, "<var startManualRec=\"");
        } else if (line.indexOf("singlefiletime=") > 0) {
            cfg.singlefiletime = parseIntTag(line, "<var singlefiletime=\"");
        } else if (line.indexOf("enable=") > 0) {
            cfg.enable = parseIntTag(line, "<var enable=\"");
        } else if (line.indexOf("filepath=") > 0) {
            cfg.filepath = parseStringTag(line, "filepath=\"");
        } else if (line.indexOf(endTag) == 0) {
            exitFlag = 1;
        } else {
            console.log("decodeRecordChCfg Unknown Line : " + line);
        }

        offset++;
    }

    return offset;
}

function decodeRecordSchCfg(lines, offset, cfg) {
    var exitFlag;
    var line;
    var endTag;
    var week0;
    var week1;
    var week2;
    var week3;
    var week4;
    var week5;
    var week6;

    var workday;
    var weekend;


    endTag = "</" + TAG_RECORD_SCH + ">";
    exitFlag = 0;
    while (0 == exitFlag) {
        line = lines[offset];


        if (line.indexOf("etm=") > 0) {
            cfg.etm = parseIntTag(line, "<var etm=\"");
        } else if (line.indexOf("workday=") > 0) {
            workday = parseStringTag(line, "<var workday=\"");
        } else if (line.indexOf("weekend=") > 0) {
            weekend = parseStringTag(line, "<var weekend=\"");
        } else if (line.indexOf("sun=") > 0) {
            week0 = parseStringTag(line, "<var sun=\"");
        } else if (line.indexOf("mon=") > 0) {
            week1 = parseStringTag(line, "<var mon=\"");
        } else if (line.indexOf("tue=") > 0) {
            week2 = parseStringTag(line, "<var tue=\"");
        } else if (line.indexOf("wed=") > 0) {
            week3 = parseStringTag(line, "<var wed=\"");
        } else if (line.indexOf("thu=") > 0) {
            week4 = parseStringTag(line, "<var thu=\"");
        } else if (line.indexOf("fri=") > 0) {
            week5 = parseStringTag(line, "<var fri=\"");
        } else if (line.indexOf("sat=") > 0) {
            week6 = parseStringTag(line, "<var sat=\"");
        } else if (line.indexOf(endTag) == 0) {
            exitFlag = 1;
        } else {
            console.log("decodeRecordSchCfg Unknown Line : " + line);
        }

        offset++;
    }

    cfg.enWorkday = parseWeekStr(workday, cfg.workday);
    cfg.enWeekend = parseWeekStr(weekend, cfg.weekend);
    cfg.enSun = parseWeekStr(week0, cfg.sun);
    cfg.enMon = parseWeekStr(week1, cfg.mon);
    cfg.enTue = parseWeekStr(week2, cfg.tue);
    cfg.enWed = parseWeekStr(week3, cfg.wed);
    cfg.enThu = parseWeekStr(week4, cfg.thu);
    cfg.enFri = parseWeekStr(week5, cfg.fri);
    cfg.enSat = parseWeekStr(week6, cfg.sat);



    return offset;
}

function decodeImageCfg(lines, offset, cfg) {
    var exitFlag;
    var line;
    var endTag;


    endTag = "</" + TAG_IMAGE_CFG + ">";
    exitFlag = 0;
    while (0 == exitFlag) {
        line = lines[offset];


        if (line.indexOf("devno=") > 0) {
            cfg.devno = parseIntTag(line, "<var devno=\"");
        } else if (line.indexOf("chn=") > 0) {
            cfg.chn = parseIntTag(line, "<var chn=\"");
        } else if (line.indexOf("flip=") > 0) {
            cfg.flip = parseIntTag(line, "<var flip=\"");
        } else if (line.indexOf("mirror=") > 0) {
            cfg.mirror = parseIntTag(line, "<var mirror=\"");
        } else if (line.indexOf("wdr=") > 0) {
            cfg.wdr = parseIntTag(line, "<var wdr=\"");
        } else if (line.indexOf(endTag) == 0) {
            exitFlag = 1;
        } else {
            console.log("decodeImageCfg Unknown Line : " + line);
        }

        offset++;
    }

    return offset;
}

function decodePtzCfg(lines, offset, cfg) {
    var exitFlag;
    var line;
    var endTag;


    endTag = "</" + TAG_PTZ_CFG + ">";
    exitFlag = 0;
    while (0 == exitFlag) {
        line = lines[offset];


        if (line.indexOf("leftPos=") > 0) {
            cfg.leftPos = parseIntTag(line, "<var leftPos=\"");
        } else if (line.indexOf("rightPos=") > 0) {
            cfg.rightPos = parseIntTag(line, "<var rightPos=\"");
        } else if (line.indexOf("upPos=") > 0) {
            cfg.upPos = parseIntTag(line, "<var upPos=\"");
        } else if (line.indexOf("downPos=") > 0) {
            cfg.downPos = parseIntTag(line, "<var downPos=\"");
        } else if (line.indexOf("farPos=") > 0) {
            cfg.farPos = parseIntTag(line, "<var farPos=\"");
        } else if (line.indexOf("nearPos=") > 0) {
            cfg.nearPos = parseIntTag(line, "<var nearPos=\"");
        }
        else if (line.indexOf("currPanPos=") > 0) {
            cfg.nearPos = parseIntTag(line, "<var currPanPos=\"");
        }
        else if (line.indexOf("currTiltPos=") > 0) {
            cfg.nearPos = parseIntTag(line, "<var currTiltPos=\"");
        }
        else if (line.indexOf("currZoomPos=") > 0) {
            cfg.nearPos = parseIntTag(line, "<var currZoomPos=\"");
        }
        else if (line.indexOf(endTag) == 0) {
            exitFlag = 1;
        } else {
            console.log("decodePTZCfg Unknown Line : " + line);
        }

        offset++;
    }

    return offset;
}

function decodeMdCfg(lines, offset, cfg) {
    var exitFlag;
    var line;
    var endTag;


    endTag = "</" + TAG_MD_CFG + ">";
    exitFlag = 0;
    while (0 == exitFlag) {
        line = lines[offset];


        if (line.indexOf("md_email_switch=") > 0) {
            cfg.md_email_switch = parseIntTag(line, "<var md_email_switch=\"");
        } else if (line.indexOf("md_snap_switch=") > 0) {
            cfg.md_snap_switch = parseIntTag(line, "<var md_snap_switch=\"");
        } else if (line.indexOf("md_emailsnap_switch=") > 0) {
            cfg.md_emailsnap_switch = parseIntTag(line, "<var md_emailsnap_switch=\"");
        } else if (line.indexOf("md_ftpsnap_switch=") > 0) {
            cfg.md_ftpsnap_switch = parseIntTag(line, "<var md_ftpsnap_switch=\"");
        } else if (line.indexOf("md_record_switch=") > 0) {
            cfg.md_record_switch = parseIntTag(line, "<var md_record_switch=\"");
        } else if (line.indexOf("md_ftprec_switch=") > 0) {
            cfg.md_ftprec_switch = parseIntTag(line, "<var md_ftprec_switch=\"");
        } else if (line.indexOf("md_ioalmdo_switch=") > 0) {
            cfg.md_ioalmdo_switch = parseIntTag(line, "<var md_ioalmdo_switch=\"");
        } else if (line.indexOf("etm=") > 0) {
            cfg.etm = parseIntTag(line, "<var etm=\"");
        } else if (line.indexOf("workday=") > 0) {
            cfg.workday = parseIntTag(line, "<var workday=\"");
        } else if (line.indexOf("weekend=") > 0) {
            cfg.weekend = parseIntTag(line, "<var weekend=\"");
        } else if (line.indexOf("md_interval=") > 0) {
            cfg.md_interval = parseIntTag(line, "<var md_interval=\"");
        } else if (line.indexOf("MdbEnable=") > 0) {
            cfg.MdbEnable = parseIntTag(line, "<var MdbEnable=\"");
        } else if (line.indexOf("MdSensitiValue=") > 0) {
            cfg.MdSensitiValue = parseIntTag(line, "<var MdSensitiValue=\"");
        } else if (line.indexOf("MDThresholdValue=") > 0) {
            cfg.MDThresholdValue = parseIntTag(line, "<var MDThresholdValue=\"");
        } else if (line.indexOf("MdInterval=") > 0) {
            cfg.MdInterval = parseIntTag(line, "<var MdInterval=\"");
        } else if (line.indexOf("MdRegion[") > 0) {
            var mdCfg = VUtil_parseMdLine(line);
            cfg.MdRegion[mdCfg.index] = mdCfg.value;
        } else if (line.indexOf("md_alarm=") > 0) {
            cfg.md_alarm = parseIntTag(line, "<var md_alarm=\"");
        } else if (line.indexOf("defend_alarm=") > 0) {
            cfg.defend_alarm = parseIntTag(line, "<var defend_alarm=\"");
        } else if (line.indexOf("tc_alarm=") > 0) {
            cfg.tc_alarm = parseIntTag(line, "<var tc_alarm=\"");
        } else if (line.indexOf(endTag) == 0) {
            exitFlag = 1;
        } else {
            console.log("decodeMdCfg Unknown Line : " + line);
        }

        offset++;
    }

    return offset;
}

function decodeDevInfo(lines, offset, cfg) {
    var exitFlag;
    var line;
    var endTag;


    endTag = "</" + TAG_DEV_INFO + ">";
    exitFlag = 0;
    while (0 == exitFlag) {
        line = lines[offset];


        if (line.indexOf("hwVer=") > 0) {
            cfg.hwVer = parseIntTag(line, "<var hwVer=\"");
        } else if (line.indexOf("swVer=") > 0) {
            cfg.swVer = parseIntTag(line, "<var swVer=\"");
        } else if (line.indexOf("provisioningVer=") > 0) {
            cfg.provisioningVer = parseIntTag(line, "<var provisioningVer=\"");
        } else if (line.indexOf("publisherVer=") > 0) {
            cfg.publisherVer = parseIntTag(line, "<var publisherVer=\"");
        } else if (line.indexOf("serialNo=") > 0) {
            cfg.serialNo = parseStringTag(line, "<var serialNo=\"");
        } else if (line.indexOf(endTag) == 0) {
            exitFlag = 1;
        } else {
            console.log("decodeDevInfo Unknown Line : " + line);
        }

        offset++;
    }

    return offset;
}

function decodeNetInfo(lines, offset, cfg) {
    var exitFlag;
    var line;
    var endTag;


    endTag = "</" + TAG_NET_INFO + ">";
    exitFlag = 0;
    while (0 == exitFlag) {
        line = lines[offset];


        if (line.indexOf("networktype=") > 0) {
            cfg.networktype = parseStringTag(line, "<var networktype=\"");
        } else if (line.indexOf("macaddress=") > 0) {
            cfg.macaddress = parseStringTag(line, "<var macaddress=\"");
        } else if (line.indexOf("netmask=") > 0) {
            cfg.netmask = parseStringTag(line, "<var netmask=\"");
        } else if (line.indexOf("gateway=") > 0) {
            cfg.gateway = parseStringTag(line, "<var gateway=\"");
        } else if (line.indexOf("sdnsip=") > 0) {
            cfg.sdnsip = parseStringTag(line, "<var sdnsip=\"");
        } else if (line.indexOf("fdnsip=") > 0) {
            cfg.fdnsip = parseStringTag(line, "<var fdnsip=\"");
        } else if (line.indexOf("ip=") > 0) {
            cfg.ip = parseStringTag(line, "<var ip=\"");
        } else if (line.indexOf(endTag) == 0) {
            exitFlag = 1;
        } else {
            console.log("decodeNetInfo Unknown Line : " + line);
        }

        offset++;
    }

    return offset;
}


function printConfig(settings) {
    console.log("************* AppSettings ************");
    console.log("Uuid : " + settings.uuid);
    console.log("GrUuid : " + settings.grUuid);
    printStreamCfg(settings.streamCfg);
    printTimeCfg(settings.timeCfg);
    printEmailCfg(settings.emailCfg);
    printVideoCfg(settings.videoCh011, settings.videoCh012, settings.videoCh013);
    printDisplayCfg(settings.displayCfg);
    printOsdCfg(settings.osdCfg);
    printRecordCfg(settings.recordCh011, settings.recordCh012, settings.recordSch, settings.rectime);
    printImageCfg(settings.imageCfg);
    printMdCfg(settings.mdCfg);
    printDevInfo(settings.devInfo)
    printNwInfo(settings.nwInfo);
}

function printStreamCfg(cfg) {
    console.log("*** Stream Cfg ***");
    console.log("enabled : " + cfg.enabled);
    console.log("enableAudio : " + cfg.enableAudio);
    console.log("publishUrl : " + cfg.publishUrl);
    console.log("mqttUrl : " + cfg.mqttUrl);
    console.log("enableTelnet : " + cfg.enableTelnet);
    console.log("telnetUrl : " + cfg.telnetUrl);
    console.log("isHd : " + cfg.isHd);
}

function printTimeCfg(cfg) {
    console.log("*** Time Cfg ***");
    console.log("time : " + cfg.time);
    console.log("timeZone : " + cfg.timeZone);
    console.log("tz : " + cfg.tz);
    console.log("dstmode : " + cfg.dstmode);
    console.log("autoupdate : " + cfg.autoupdate);
    console.log("autoupdatetzonvif : " + cfg.autoupdatetzonvif);
    console.log("ntpserver : " + cfg.ntpserver);
    console.log("ntpinterval : " + cfg.ntpinterval);
    console.log("ntpenable : " + cfg.ntpenable);
}

function printVideoCfg(ch011, ch012, ch013) {
    console.log("*** Video Cfg ***\n");
    console.log("CH011:");
    console.log("bps : " + ch011.bps);
    console.log("fps : " + ch011.fps);
    console.log("gop : " + ch011.gop);
    console.log("brmode : " + ch011.brmode);
    console.log("piclevel : " + ch011.piclevel);
    console.log("fixqplevel : " + ch011.fixqplevel);
    console.log("width : " + ch011.width);
    console.log("height : " + ch011.height);
    console.log("bmainstream : " + ch011.bmainstream);
    console.log("bfield : " + ch011.bfield);

    console.log("CH012:");
    console.log("bps : " + ch012.bps);
    console.log("fps : " + ch012.fps);
    console.log("gop : " + ch012.gop);
    console.log("brmode : " + ch012.brmode);
    console.log("piclevel : " + ch012.piclevel);
    console.log("fixqplevel : " + ch012.fixqplevel);
    console.log("width : " + ch012.width);
    console.log("height : " + ch012.height);
    console.log("bmainstream : " + ch012.bmainstream);
    console.log("bfield : " + ch012.bfield);

    console.log("CH013:");
    console.log("bps : " + ch013.bps);
    console.log("fps : " + ch013.fps);
    console.log("gop : " + ch013.gop);
    console.log("brmode : " + ch013.brmode);
    console.log("piclevel : " + ch013.piclevel);
    console.log("fixqplevel : " + ch013.fixqplevel);
    console.log("width : " + ch013.width);
    console.log("height : " + ch013.height);
    console.log("bmainstream : " + ch013.bmainstream);
    console.log("bfield : " + ch013.bfield);
}

function printEmailCfg(cfg) {
    console.log("*** Email Cfg ***\n");
    console.log("emailserver : " + cfg.emailserver);
    console.log("emailport : " + cfg.emailport);
    console.log("ssl : " + cfg.ssl);
    console.log("logintype : " + cfg.logintype);
    console.log("emailusername : " + cfg.emailusername);
    console.log("emailpassword : " + cfg.emailpassword);
    console.log("from : " + cfg.from);
    console.log("to : " + cfg.to);
    console.log("subject : " + cfg.subject);
    console.log("text : " + cfg.text);
    console.log("attatchment : " + cfg.attatchment);
}

function printDisplayCfg(cfg) {
    console.log("*** Display Cfg ***\n");
    console.log("hue : " + cfg.hue);
    console.log("brightness : " + cfg.brightness);
    console.log("saturation : " + cfg.saturation);
    console.log("contrast : " + cfg.contrast);
    console.log("ircutmode : " + cfg.ircutmode);
}

function printOsdCfg(cfg) {
    console.log("*** Osd Cfg ***\n");
    console.log("rgncnt : " + cfg.rgncnt);
    console.log("fontsize : " + cfg.fontsize);
    console.log("x_0 : " + cfg.x_0);
    console.log("y_0 : " + cfg.y_0);
    console.log("w_0 : " + cfg.w_0);
    console.log("h_0 : " + cfg.h_0);
    console.log("cont_0 : " + cfg.cont_0);
    console.log("show_0 : " + cfg.show_0);
    console.log("x_1 : " + cfg.x_1);
    console.log("y_1 : " + cfg.y_1);
    console.log("w_1 : " + cfg.w_1);
    console.log("h_1 : " + cfg.h_1);
    console.log("cont_1 : " + cfg.cont_1);
    console.log("show_1 : " + cfg.show_1);
}

function printImageCfg(cfg) {
    console.log("*** Image Cfg ***\n");
    console.log("devno : " + cfg.devno);
    console.log("chn : " + cfg.chn);
    console.log("flip : " + cfg.flip);
    console.log("mirror : " + cfg.mirror);
    console.log("wdr : " + cfg.wdr);
}

function printRecordCfg(ch1, ch2, sch, rectime) {
    var hrSch;

    console.log("*** Record Cfg ***\n");
    console.log("CH1: \n");
    console.log("startTimerRec : " + ch1.startTimerRec);
    console.log("startManualRec : " + ch1.startManualRec);
    console.log("singlefiletime : " + ch1.singlefiletime);
    console.log("enable : " + ch1.enable);
    console.log("filepath : " + ch1.filepath);
    console.log("CH2: \n");
    console.log("startTimerRec : " + ch2.startTimerRec);
    console.log("startManualRec : " + ch2.startManualRec);
    console.log("singlefiletime : " + ch2.singlefiletime);
    console.log("enable : " + ch2.enable);
    console.log("filepath : " + ch2.filepath);

    console.log("SCH: \n");
    console.log("etm : " + sch.etm);
    hrSch = VUtil_schToHrSch(sch.workday);
    console.log("workday : " +
        hrSch.tp1StartHr + ":" + hrSch.tp1StartMin + "~" + hrSch.tp1EndHr + ":" + hrSch.tp1EndMin + ", " +
        hrSch.tp2StartHr + ":" + hrSch.tp2StartMin + "~" + hrSch.tp2EndHr + ":" + hrSch.tp2EndMin + ", " +
        hrSch.tp3StartHr + ":" + hrSch.tp3StartMin + "~" + hrSch.tp3EndHr + ":" + hrSch.tp3EndMin
    );
    hrSch = VUtil_schToHrSch(sch.weekend);
    console.log("weekend : " +
        hrSch.tp1StartHr + ":" + hrSch.tp1StartMin + "~" + hrSch.tp1EndHr + ":" + hrSch.tp1EndMin + ", " +
        hrSch.tp2StartHr + ":" + hrSch.tp2StartMin + "~" + hrSch.tp2EndHr + ":" + hrSch.tp2EndMin + ", " +
        hrSch.tp3StartHr + ":" + hrSch.tp3StartMin + "~" + hrSch.tp3EndHr + ":" + hrSch.tp3EndMin
    );

    hrSch = VUtil_schToHrSch(sch.sun);
    console.log("sun : " +
        hrSch.tp1StartHr + ":" + hrSch.tp1StartMin + "~" + hrSch.tp1EndHr + ":" + hrSch.tp1EndMin + ", " +
        hrSch.tp2StartHr + ":" + hrSch.tp2StartMin + "~" + hrSch.tp2EndHr + ":" + hrSch.tp2EndMin + ", " +
        hrSch.tp3StartHr + ":" + hrSch.tp3StartMin + "~" + hrSch.tp3EndHr + ":" + hrSch.tp3EndMin
    );
    hrSch = VUtil_schToHrSch(sch.mon);
    console.log("mon : " +
        hrSch.tp1StartHr + ":" + hrSch.tp1StartMin + "~" + hrSch.tp1EndHr + ":" + hrSch.tp1EndMin + ", " +
        hrSch.tp2StartHr + ":" + hrSch.tp2StartMin + "~" + hrSch.tp2EndHr + ":" + hrSch.tp2EndMin + ", " +
        hrSch.tp3StartHr + ":" + hrSch.tp3StartMin + "~" + hrSch.tp3EndHr + ":" + hrSch.tp3EndMin
    );
    hrSch = VUtil_schToHrSch(sch.tue);
    console.log("tue : " +
        hrSch.tp1StartHr + ":" + hrSch.tp1StartMin + "~" + hrSch.tp1EndHr + ":" + hrSch.tp1EndMin + ", " +
        hrSch.tp2StartHr + ":" + hrSch.tp2StartMin + "~" + hrSch.tp2EndHr + ":" + hrSch.tp2EndMin + ", " +
        hrSch.tp3StartHr + ":" + hrSch.tp3StartMin + "~" + hrSch.tp3EndHr + ":" + hrSch.tp3EndMin
    );
    hrSch = VUtil_schToHrSch(sch.wed);
    console.log("wed : " +
        hrSch.tp1StartHr + ":" + hrSch.tp1StartMin + "~" + hrSch.tp1EndHr + ":" + hrSch.tp1EndMin + ", " +
        hrSch.tp2StartHr + ":" + hrSch.tp2StartMin + "~" + hrSch.tp2EndHr + ":" + hrSch.tp2EndMin + ", " +
        hrSch.tp3StartHr + ":" + hrSch.tp3StartMin + "~" + hrSch.tp3EndHr + ":" + hrSch.tp3EndMin
    );
    hrSch = VUtil_schToHrSch(sch.thu);
    console.log("thu : " +
        hrSch.tp1StartHr + ":" + hrSch.tp1StartMin + "~" + hrSch.tp1EndHr + ":" + hrSch.tp1EndMin + ", " +
        hrSch.tp2StartHr + ":" + hrSch.tp2StartMin + "~" + hrSch.tp2EndHr + ":" + hrSch.tp2EndMin + ", " +
        hrSch.tp3StartHr + ":" + hrSch.tp3StartMin + "~" + hrSch.tp3EndHr + ":" + hrSch.tp3EndMin
    );
    hrSch = VUtil_schToHrSch(sch.fri);
    console.log("fri : " +
        hrSch.tp1StartHr + ":" + hrSch.tp1StartMin + "~" + hrSch.tp1EndHr + ":" + hrSch.tp1EndMin + ", " +
        hrSch.tp2StartHr + ":" + hrSch.tp2StartMin + "~" + hrSch.tp2EndHr + ":" + hrSch.tp2EndMin + ", " +
        hrSch.tp3StartHr + ":" + hrSch.tp3StartMin + "~" + hrSch.tp3EndHr + ":" + hrSch.tp3EndMin
    );
    hrSch = VUtil_schToHrSch(sch.sat);
    console.log("sat : " +
        hrSch.tp1StartHr + ":" + hrSch.tp1StartMin + "~" + hrSch.tp1EndHr + ":" + hrSch.tp1EndMin + ", " +
        hrSch.tp2StartHr + ":" + hrSch.tp2StartMin + "~" + hrSch.tp2EndHr + ":" + hrSch.tp2EndMin + ", " +
        hrSch.tp3StartHr + ":" + hrSch.tp3StartMin + "~" + hrSch.tp3EndHr + ":" + hrSch.tp3EndMin
    );

    console.log("rectime : " + rectime);
}

function printMdCfg(cfg) {
    console.log("*** Md Cfg ***\n");
    console.log("md_email_switch : " + cfg.md_email_switch);

    console.log("md_snap_switch : " + cfg.md_snap_switch);
    console.log("md_emailsnap_switch : " + cfg.md_emailsnap_switch);
    console.log("md_ftpsnap_switch : " + cfg.md_ftpsnap_switch);

    console.log("md_record_switch : " + cfg.md_record_switch);
    console.log("md_ftprec_switch : " + cfg.md_ftprec_switch);

    console.log("md_ioalmdo_switch : " + cfg.md_ioalmdo_switch);

    console.log("etm : " + cfg.etm);
    console.log("workday : " + cfg.workday);
    console.log("weekend : " + cfg.weekend);
    console.log("md_interval : " + cfg.md_interval);

    console.log("MdbEnable : " + cfg.MdbEnable);
    console.log("MdSensitiValue : " + cfg.MdSensitiValue);
    console.log("MDThresholdValue : " + cfg.MDThresholdValue);
    console.log("MdInterval : " + cfg.MdInterval);
    var i;
    for (i = 0; i < 32; i++) {
        console.log("MdRegion[" + i + "] : " + cfg.MdRegion[i]);
    }

    console.log("md_alarm : " + cfg.md_alarm);
    console.log("defend_alarm : " + cfg.defend_alarm);
    console.log("tc_alarm : " + cfg.tc_alarm);
}

function printDevInfo(info) {
    console.log("*** Dev Info ***");
    console.log("hwVer : " + info.hwVer);
    console.log("swVer : " + info.swVer);
    console.log("provisioningVer : " + info.provisioningVer);
    console.log("publisherVer : " + info.publisherVer);
    console.log("serialNo : " + info.serialNo);
}

function printNwInfo(info) {
    console.log("*** Network Info ***");
    console.log("networktype : " + info.networktype);
    console.log("macaddress : " + info.macaddress);
    console.log("ip : " + info.ip);
    console.log("netmask : " + info.netmask);
    console.log("gateway : " + info.gateway);
    console.log("sdnsip : " + info.sdnsip);
    console.log("fdnsip : " + info.fdnsip);
}

function parseStringTag(line, tag) {
    var start = 0;
    var end = 0;
    var value;

    start = line.indexOf(tag);
    start += tag.length;
    end = line.indexOf("\"/>");
    value = line.substring(start, end);

    return value;
}

function parseIntTag(line, tag) {
    var start = 0;
    var end = 0;
    var value;

    start = line.indexOf(tag);
    start += tag.length;
    end = line.indexOf("\"/>");
    value = line.substring(start, end);

    return parseInt(value);
}

function VUtil_parseMdLine(mdStr) {
    var mdCfg = { index: 0, value: 0 };
    var start;
    var end;

    var index;
    var value;


    start = mdStr.indexOf("MdRegion[");
    start += 9;
    end = mdStr.indexOf("]=");
    index = mdStr.substring(start, end);

    start = mdStr.indexOf("]=\"");
    start += 3;
    end = mdStr.indexOf("\"/>");
    value = mdStr.substring(start, end);

    mdCfg.index = parseInt(index);
    mdCfg.value = parseInt(value);

    return mdCfg;
}

function VUtil_parseStatLine(statStr) {
    var clientStat = { name: "", isUp: 0 };
    var start;
    var end;

    var name;
    var isUp;

    start = statStr.indexOf("name=");
    start += 5;
    end = statStr.indexOf(" value=");
    name = statStr.substring(start, end);


    start = statStr.indexOf("value=");
    start += 6;
    end = start + 1;
    isUp = statStr.substring(start, end);

    clientStat.name = name;
    clientStat.isUp = parseInt(isUp);

    return clientStat;
}

function parseWeekStr(str, sch) {
    var i;
    var res = str.split(",");
    var sub;
    var enabled;

    for (i = 0; i < 6; i++) {
        sch[i] = -1;
    }

    for (i = 0; i < res.length; i++) {
        sub = res[i].split("~");
        sch[2 * i + 0] = parseInt(sub[0]);
        sch[2 * i + 1] = parseInt(sub[1]);
    }

    var hrSch;

    enabled = 0;
    hrSch = VUtil_schToHrSch(sch)
    if (hrSch.tp1StartHr > 0) {
        enabled = 1;
    }
    if (hrSch.tp1StartMin > 0) {
        enabled = 1;
    }
    if (hrSch.tp1EndHr > 0) {
        enabled = 1;
    }
    if (hrSch.tp1EndMin > 0) {
        enabled = 1;
    }

    if (hrSch.tp2StartHr > 0) {
        enabled = 1;
    }
    if (hrSch.tp2StartMin > 0) {
        enabled = 1;
    }
    if (hrSch.tp2EndHr > 0) {
        enabled = 1;
    }
    if (hrSch.tp2EndMin > 0) {
        enabled = 1;
    }

    if (hrSch.tp3StartHr > 0) {
        enabled = 1;
    }
    if (hrSch.tp3StartMin > 0) {
        enabled = 1;
    }
    if (hrSch.tp3EndHr > 0) {
        enabled = 1;
    }
    if (hrSch.tp3EndMin > 0) {
        enabled = 1;
    }

    return enabled;
}

function VUtil_schToHrSch(sch) {
    var min;

    var hrSch = {
        tp1StartHr: 0,
        tp1StartMin: 0,
        tp1EndHr: 0,
        tp1EndMin: 0,

        tp2StartHr: 0,
        tp2StartMin: 0,
        tp2EndHr: 0,
        tp2EndMin: 0,

        tp3StartHr: 0,
        tp3StartMin: 0,
        tp3EndHr: 0,
        tp3EndMin: 0
    };

    hrSch.tp1StartHr = parseInt((sch[0]) / 4);
    min = parseInt(((sch[0]) % 4) * 15);
    hrSch.tp1StartMin = parseInt(min > 0 ? min : 0);
    hrSch.tp1EndHr = parseInt((sch[1] + 1) / 4);
    hrSch.tp1EndMin = parseInt(((sch[1] + 1) % 4) * 15);

    hrSch.tp2StartHr = parseInt((sch[2]) / 4);
    min = parseInt(((sch[2]) % 4) * 15);
    hrSch.tp2StartMin = parseInt(min > 0 ? min : 0);
    hrSch.tp2EndHr = parseInt((sch[3] + 1) / 4);
    hrSch.tp2EndMin = parseInt(((sch[3] + 1) % 4) * 15);

    hrSch.tp3StartHr = parseInt((sch[4]) / 4);
    min = parseInt(((sch[4]) % 4) * 15);
    hrSch.tp3StartMin = parseInt(min > 0 ? min : 0);
    hrSch.tp3EndHr = parseInt((sch[5] + 1) / 4);
    hrSch.tp3EndMin = parseInt(((sch[5] + 1) % 4) * 15);

    return hrSch;
}

function VUtil_hrSchToSch(hrSch, sch) {
    var min;

    sch[0] = parseInt(4 * (hrSch.tp1StartHr));
    min = parseInt((hrSch.tp1StartMin) / 15);
    sch[0] += parseInt((min > 0) ? min : 0);
    sch[1] = parseInt(4 * (hrSch.tp1EndHr) - 1);
    min = parseInt((hrSch.tp1EndMin) / 15);
    sch[1] += parseInt((min > 0) ? min : 0);

    sch[2] = parseInt(4 * (hrSch.tp2StartHr));
    min = parseInt((hrSch.tp2StartMin) / 15);
    sch[2] += parseInt((min > 0) ? min : 0);
    sch[3] = parseInt(4 * (hrSch.tp2EndHr) - 1);
    min = parseInt((hrSch.tp2EndMin) / 15);
    sch[3] += parseInt((min > 0) ? min : 0);

    sch[4] = parseInt(4 * (hrSch.tp3StartHr));
    min = parseInt((hrSch.tp3StartMin) / 15);
    sch[4] += parseInt((min > 0) ? min : 0);
    sch[5] = parseInt(4 * (hrSch.tp3EndHr) - 1);
    min = parseInt((hrSch.tp3EndMin) / 15);
    sch[5] += parseInt((min > 0) ? min : 0);
}

function VUtil_getStringFromBuff(buff, offset, len) {
    var string = "";

    for (var i = offset; i < (offset + len); i++) {
        string += String.fromCharCode(buff[i]);
    }

    return string;
}

function VUtil_getMsgString(msgType) {
    var msgStr = ["Keep Alive", "Get Config", "Set Config", "Audio", "File", "Disconnect", "Get Status"];

    return msgStr[msgType];
}



function VUtil_validateConfig(cfg) {
    if (0 != VUtil_isUuidValid(cfg.uuid)) {
        console.log("UUID is not valid : " + cfg.uuid);
        return -1;
    }

    if (0 == cfg.grUuid.localeCompare("")) {
        console.log("grUuid is not valid : " + cfg.grUuid);
        return -1;
    }

    if (0 != isStreamCfgValid((cfg.streamCfg))) {
        console.log("streamCfg is not valid");
        return -1;
    }

    if (0 != isTimeCfgValid((cfg.timeCfg))) {
        console.log("timeCfg is not valid");
        return -1;
    }

    if (0 != isEmailCfgValid((cfg.emailCfg))) {
        console.log("emailCfg is not valid");
        return -1;
    }

    if (0 != isVideoCfgValid((cfg))) {
        console.log("videoCfg is not valid");
        return -1;
    }

    if (0 != isDisplayCfgValid((cfg.displayCfg))) {
        console.log("displayCfg is not valid");
        return -1;
    }

    if (0 != isOsdCfgValid((cfg.osdCfg))) {
        console.log("osdCfg is not valid");
        return -1;
    }

    if (0 != isRecordCfgValid((cfg))) {
        console.log("recordCfg is not valid");
        return -1;
    }

    if (0 != isImageCfgValid((cfg.imageCfg))) {
        console.log("imageCfg is not valid");
        return -1;
    }

    if (0 != isMdCfgValid((cfg.mdCfg))) {
        console.log("mdCfg is not valid");
        return -1;
    }

    if (0 != isDevInfoValid((cfg.devInfo))) {
        console.log("devInfo is not valid");
        return -1;
    }

    if (0 != isNwInfoValid((cfg.nwInfo))) {
        console.log("nwInfo is not valid");
        return -1;
    }


    return 0;
}

function VUtil_isUuidValid(uuid) {
    var dashCnt = 0;
    var i;
    var strLen;


    dashCnt = 0;
    strLen = uuid.length;
    for (i = 0; i < strLen; i++) {
        if ('-' == uuid[i]) {
            dashCnt++;
        }
    }

    if ((0 == uuid.localeCompare("")) || (0 == uuid.localeCompare("undefined")) || (17 != strLen) || (2 != dashCnt)) {
        return -1;
    }

    return 0;
}

function isStreamCfgValid(cfg1) {
    if ((0 != cfg1.enabled) && (1 != cfg1.enabled)) {
        console.log("enabled invalid : " + cfg1.enabled);
        return -1;
    }
    if ((0 != cfg1.enableAudio) && (1 != cfg1.enableAudio)) {
        console.log("enableAudio invalid : " + cfg1.enableAudio);
        return -1;
    }
    if (0 == cfg1.publishUrl.localeCompare("")) {
        console.log("publishUrl invalid : " + cfg1.publishUrl);
        return -1;
    }
    if ((0 == cfg1.mqttUrl.localeCompare("")) || (0 == cfg1.mqttUrl.localeCompare("null")) || (0 == cfg1.mqttUrl.localeCompare("undefined"))) {
        console.log("mqttUrl invalid : " + cfg1.mqttUrl);
        return -1;
    }

    if ((0 != cfg1.enableTelnet) && (1 != cfg1.enableTelnet)) {
        console.log("enableTelnet invalid : " + cfg1.enableTelnet);
        return -1;
    }
    if ((0 == cfg1.telnetUrl.localeCompare("")) || (0 == cfg1.telnetUrl.localeCompare("null")) || (0 == cfg1.telnetUrl.localeCompare("undefined"))) {
        console.log("telnetUrl invalid : " + cfg1.telnetUrl);
        return -1;
    }
    if (isTelnetCfgValid(cfg1.telnetUrl) < 0) {
        console.log("telnetCfg invalid : " + cfg1.telnetUrl);
        return -1;
    }

    if ((0 != cfg1.isHd) && (1 != cfg1.isHd)) {
        console.log("isHd invalid : " + cfg1.isHd);
        return -1;
    }

    return 0;
}

function isTelnetCfgValid(telnetUrl) {
    var i;
    var strLen;
    var val;
    var port;
    var isDigit;
    var isAlphaCap;
    var isAlphaSmall;


    var subStr = [];
    subStr = telnetUrl.split(":");
    if (null == subStr) {
        console.log("Invalid URL : null");
        return -1;
    }

    if (2 != subStr.length) {
        console.log("Invalid URL : specify ADDR:PORT");
        return -1;
    }

    if (subStr[0].length <= 0) {
        console.log("Invalid URL : Addr is invalid");
        return -1;
    }

    if (subStr[1].length <= 0) {
        console.log("Invalid URL : port is invalid");
        return -1;
    }

    port = parseInt(subStr[1]);
    strLen = telnetUrl.length;

    console.log(">>>>>>> IP : " + subStr[0] + ", Port : " + parseInt(subStr[1]));

    if ((strLen <= 0) || (strLen >= 100)) {
        console.log("Invalid URL len : " + strLen);
        return -1;
    }


    if (((subStr[0].indexOf(".vmukti.com")) <= 0) && ((subStr[0].indexOf(".ambicam.com")) <= 0)) {
        console.log("Invalid URL : " + subStr[0] + ", should have .vmukti.com OR .ambicam.com");
        return -1;
    }
    for (i = 0; i < strLen; i++) {
        val = telnetUrl.charCodeAt(i);
        if ((val >= 48) && (val <= 57)) {
            isDigit = true;
        } else {
            isDigit = false;
        }

        if ((val >= 65) && (val <= 90)) {
            isAlphaCap = true;
        } else {
            isAlphaCap = false;
        }

        if ((val >= 97) && (val <= 122)) {
            isAlphaSmall = true;
        } else {
            isAlphaSmall = false;
        }

        if ((!isDigit) && (!isAlphaCap) && (!isAlphaSmall)) {
            if ((46 != val) && (58 != val)) {
                console.log("Invalid URL : " + val + "  Neitther ./: NOR alphanum");
                return -1;
            }
        }
    }

    if ((port <= 0) || (port >= 65535)) {
        console.log("Port is invalid : " + port);
        return -1;
    }

    return 0;
}

function isTimeCfgValid(cfg1) {
    //@NOTE : time will always mismatch.
    //	if (0 == cfg1.time.localeCompare("")) {
    //		console.log("time invalid : " + cfg1.time);
    //		return -1;
    //	}

    if (0 == cfg1.timeZone.localeCompare("")) {
        console.log("timeZone invalid : " + cfg1.timeZone);
        return -1;
    }
    //	if (0 == cfg1.tz.localeCompare("")) {
    //		console.log("tz invalid : " + cfg1.tz);
    //		return -1;
    //	}

    if ((0 != cfg1.dstmode) && (1 != cfg1.dstmode)) {
        console.log("dstmode invalid : " + cfg1.dstmode);
        return -1;
    }
    if ((0 != cfg1.autoupdate) && (1 != cfg1.autoupdate)) {
        console.log("autoupdate invalid : " + cfg1.autoupdate);
        return -1;
    }
    if ((0 != cfg1.autoupdatetzonvif) && (1 != cfg1.autoupdatetzonvif)) {
        console.log("autoupdatetzonvif invalid : " + cfg1.autoupdatetzonvif);
        return -1;
    }

    if (0 == cfg1.ntpserver.localeCompare("")) {
        console.log("ntpserver invalid : " + cfg1.ntpserver);
        return -1;
    }

    if ((1 != cfg1.ntpinterval) && (2 != cfg1.ntpinterval) && (12 != cfg1.ntpinterval) && (24 != cfg1.ntpinterval)) {
        console.log("ntpinterval invalid : " + cfg1.ntpinterval);
        return -1;
    }
    if ((0 != cfg1.ntpenable) && (1 != cfg1.ntpenable)) {
        console.log("ntpenable invalid : " + cfg1.ntpenable);
        return -1;
    }

    return 0;
}

function isEmailCfgValid(cfg1) {

    if (0 == cfg1.emailserver.localeCompare("")) {
        console.log("emailserver invalid : " + cfg1.emailserver);
        return -1;
    }

    if ((cfg1.emailport <= 0) || (cfg1.emailport >= 65535)) {
        console.log("emailport invalid : " + cfg1.emailport);
        return -1;
    }
    if ((0 != cfg1.ssl) && (1 != cfg1.ssl)) {
        console.log("ssl invalid : " + cfg1.ssl);
        return -1;
    }
    if ((1 != cfg1.logintype) && (3 != cfg1.logintype)) {
        console.log("logintype invalid : " + cfg1.logintype);
        return -1;
    }

    if (0 == cfg1.emailusername.localeCompare("")) {
        console.log("emailusername invalid : " + cfg1.emailusername);
        return -1;
    }
    if (0 == cfg1.emailpassword.localeCompare("")) {
        console.log("emailpassword invalid : " + cfg1.emailpassword);
        return -1;
    }
    if (0 == cfg1.from.localeCompare("")) {
        console.log("from invalid : " + cfg1.from);
        return -1;
    }
    if (0 == cfg1.to.localeCompare("")) {
        console.log("to invalid : " + cfg1.to);
        return -1;
    }
    if (0 == cfg1.subject.localeCompare("")) {
        console.log("subject invalid : " + cfg1.subject);
        return -1;
    }
    //	if (0 == cfg1.text.localeCompare("")) {
    //		console.log("text invalid : " + cfg1.text);
    //		return -1;
    //	}
    //	if (0 == cfg1.attatchment.localeCompare("")) {
    //		console.log("attatchment invalid : " + cfg1.attatchment);
    //		return -1;
    //	}


    return 0;
}

function isVideoCfgValid(cfg1) {

    if ((cfg1.videoCh011.bps < 10) || (cfg1.videoCh011.bps > 10000)) {
        console.log("videoCh011.bps invalid : " + cfg1.videoCh011.bps);
        return -1;
    }
    if ((cfg1.videoCh011.fps < 1) || (cfg1.videoCh011.fps > 25)) {
        console.log("videoCh011.fps invalid : " + cfg1.videoCh011.fps);
        return -1;
    }
    //@TODO : Pravin, this is issue
    //	if ((cfg1.videoCh011.gop) < (cfg1.videoCh011.fps)) {
    //		console.log("videoCh011.gop invalid : " + cfg1.videoCh011.gop + " < fps : " + cfg1.videoCh011.fps);
    //		return -1;
    //	}
    if ((1 != cfg1.videoCh011.brmode) && (2 != cfg1.videoCh011.brmode) && (4 != cfg1.videoCh011.brmode)) {
        console.log("videoCh011.brmode invalid : " + cfg1.videoCh011.brmode);
        return -1;
    }
    if ((cfg1.videoCh011.piclevel < 1) || (cfg1.videoCh011.piclevel > 5)) {
        console.log("videoCh011.piclevel invalid : " + cfg1.videoCh011.piclevel);
        return -1;
    }
    if ((cfg1.videoCh011.fixqplevel < 1) || (cfg1.videoCh011.fixqplevel > 5)) {
        console.log("videoCh011.fixqplevel invalid : " + cfg1.videoCh011.fixqplevel);
        return -1;
    }
    if ((320 != cfg1.videoCh011.width) && (640 != cfg1.videoCh011.width) && (704 != cfg1.videoCh011.width) && (1280 != cfg1.videoCh011.width)) {
        console.log("videoCh011.width invalid : " + (cfg1.videoCh011.width));
        return -1;
    }
    if ((180 != cfg1.videoCh011.height) && (360 != cfg1.videoCh011.height) && (576 != cfg1.videoCh011.height) && (720 != cfg1.videoCh011.height)) {
        console.log("videoCh011.height invalid : " + cfg1.videoCh011.height);
        return -1;
    }
    if (1 != (cfg1.videoCh011.bmainstream)) {
        console.log("videoCh011.bmainstream invalid : " + cfg1.videoCh011.bmainstream);
        return -1;
    }
    if (0 != (cfg1.videoCh011.bfield)) {
        console.log("videoCh011.bfield invalid : " + cfg1.videoCh011.bfield);
        return -1;
    }


    if ((cfg1.videoCh012.bps < 10) || (cfg1.videoCh012.bps > 10000)) {
        console.log("videoCh012.bps invalid : " + cfg1.videoCh012.bps);
        return -1;
    }
    if ((cfg1.videoCh012.fps < 1) || (cfg1.videoCh012.fps > 25)) {
        console.log("videoCh012.fps invalid : " + cfg1.videoCh012.fps);
        return -1;
    }
    //@TODO : Pravin, this is issue
    //	if ((cfg1.videoCh012.gop) < (cfg1.videoCh012.fps)) {
    //		console.log("videoCh012.gop invalid : " + cfg1.videoCh012.gop);
    //		return -1;
    //	}
    if ((1 != cfg1.videoCh012.brmode) && (2 != cfg1.videoCh012.brmode) && (4 != cfg1.videoCh012.brmode)) {
        console.log("videoCh012.brmode invalid : " + cfg1.videoCh012.brmode);
        return -1;
    }
    if ((cfg1.videoCh012.piclevel < 1) || (cfg1.videoCh012.piclevel > 5)) {
        console.log("videoCh012.piclevel invalid : " + cfg1.videoCh012.piclevel);
        return -1;
    }
    if ((cfg1.videoCh012.fixqplevel < 1) || (cfg1.videoCh012.fixqplevel > 5)) {
        console.log("videoCh012.fixqplevel invalid : " + cfg1.videoCh012.fixqplevel);
        return -1;
    }
    if ((320 != cfg1.videoCh012.width) && (640 != cfg1.videoCh012.width) && (704 != cfg1.videoCh012.width) && (1280 != cfg1.videoCh012.width)) {
        console.log("videoCh012.width invalid : " + (cfg1.videoCh012.width));
        return -1;
    }
    if ((180 != cfg1.videoCh012.height) && (360 != cfg1.videoCh012.height) && (576 != cfg1.videoCh012.height) && (720 != cfg1.videoCh012.height)) {
        console.log("videoCh012.height invalid : " + cfg1.videoCh012.height);
        return -1;
    }
    if (1 != (cfg1.videoCh012.bmainstream)) {
        console.log("videoCh012.bmainstream invalid : " + cfg1.videoCh012.bmainstream);
        return -1;
    }
    if (0 != (cfg1.videoCh012.bfield)) {
        console.log("videoCh012.bfield invalid : " + cfg1.videoCh012.bfield);
        return -1;
    }


    if ((cfg1.videoCh013.bps < 10) || (cfg1.videoCh013.bps > 10000)) {
        console.log("videoCh013.bps invalid : " + cfg1.videoCh013.bps);
        return -1;
    }
    if ((cfg1.videoCh013.fps < 1) || (cfg1.videoCh013.fps > 25)) {
        console.log("videoCh013.fps invalid : " + cfg1.videoCh013.fps);
        return -1;
    }
    //@TODO : Pravin, this is issue
    //	if ((cfg1.videoCh013.gop) < (cfg1.videoCh013.fps)) {
    //		console.log("videoCh013.gop invalid : " + cfg1.videoCh013.gop);
    //		return -1;
    //	}
    if ((1 != cfg1.videoCh013.brmode) && (2 != cfg1.videoCh013.brmode) && (4 != cfg1.videoCh013.brmode)) {
        console.log("videoCh013.brmode invalid : " + cfg1.videoCh013.brmode);
        return -1;
    }
    if ((cfg1.videoCh013.piclevel < 1) || (cfg1.videoCh013.piclevel > 5)) {
        console.log("videoCh013.piclevel invalid : " + cfg1.videoCh013.piclevel);
        return -1;
    }
    if ((cfg1.videoCh013.fixqplevel < 1) || (cfg1.videoCh013.fixqplevel > 5)) {
        console.log("videoCh013.fixqplevel invalid : " + cfg1.videoCh013.fixqplevel);
        return -1;
    }
    if ((320 != cfg1.videoCh013.width) && (640 != cfg1.videoCh013.width) && (704 != cfg1.videoCh013.width) && (1280 != cfg1.videoCh013.width)) {
        console.log("videoCh013.width invalid : " + (cfg1.videoCh013.width));
        return -1;
    }
    if ((180 != cfg1.videoCh013.height) && (360 != cfg1.videoCh013.height) && (576 != cfg1.videoCh013.height) && (720 != cfg1.videoCh013.height)) {
        console.log("videoCh013.height invalid : " + cfg1.videoCh013.height);
        return -1;
    }
    if (1 != (cfg1.videoCh013.bmainstream)) {
        console.log("videoCh013.bmainstream invalid : " + cfg1.videoCh013.bmainstream);
        return -1;
    }
    if (0 != (cfg1.videoCh013.bfield)) {
        console.log("videoCh013.bfield invalid : " + cfg1.videoCh013.bfield);
        return -1;
    }


    return 0;
}

function isDisplayCfgValid(cfg1) {
    if ((cfg1.hue < 0) || (cfg1.hue > 100)) {
        console.log("hue invalid : " + cfg1.hue);
        return -1;
    }
    if ((cfg1.brightness < 0) || (cfg1.brightness > 100)) {
        console.log("brightness invalid : " + cfg1.brightness);
        return -1;
    }
    if ((cfg1.saturation < 0) || (cfg1.saturation > 100)) {
        console.log("saturation invalid : " + cfg1.saturation);
        return -1;
    }
    if ((cfg1.contrast < 0) || (cfg1.contrast > 100)) {
        console.log("contrast invalid : " + cfg1.contrast);
        return -1;
    }
    if ((cfg1.ircutmode < 0) || (cfg1.ircutmode > 3)) {
        console.log("ircutmode invalid : " + cfg1.ircutmode);
        return -1;
    }

    return 0;
}
function isOsdCfgValid(cfg1) {

    if ((cfg1.rgncnt < 1) || (cfg1.rgncnt > 2)) {
        console.log("rgncnt invalid : " + cfg1.rgncnt);
        return -1;
    }
    if ((cfg1.fontsize < 0) || (cfg1.fontsize > 2)) {
        console.log("fontsize invalid : " + cfg1.fontsize);
        return -1;
    }

    //	if ((cfg1.x_0 < 0) || (cfg1.x_0 > 2)) {
    //		console.log("x_0 invalid : " + cfg1.x_0);
    //		return -1;
    //	}
    //	if ((cfg1.y_0 < 0) || (cfg1.y_0 > 2)) {
    //		console.log("y_0 invalid : " + cfg1.y_0);
    //		return -1;
    //	}
    //	if ((cfg1.w_0 < 0) || (cfg1.w_0 > 2)) {
    //		console.log("w_0 invalid : " + cfg1.w_0);
    //		return -1;
    //	}
    //	if ((cfg1.h_0 < 0) || (cfg1.h_0 > 2)) {
    //		console.log("h_0 invalid : " + cfg1.h_0);
    //		return -1;
    //	}
    if (0 == cfg1.cont_0.localeCompare("")) {
        console.log("cont_0 invalid : " + cfg1.cont_0);
        return -1;
    }
    if ((cfg1.show_0 < 0) || (cfg1.show_0 > 1)) {
        console.log("show_0 invalid : " + cfg1.show_0);
        return -1;
    }



    //	if ((cfg1.x_1 < 0) || (cfg1.x_1 > 2)) {
    //		console.log("x_1 invalid : " + cfg1.x_1);
    //		return -1;
    //	}
    //	if ((cfg1.y_1 < 0) || (cfg1.y_1 > 2)) {
    //		console.log("y_1 invalid : " + cfg1.y_1);
    //		return -1;
    //	}
    //	if ((cfg1.w_1 < 0) || (cfg1.w_1 > 2)) {
    //		console.log("w_1 invalid : " + cfg1.w_1);
    //		return -1;
    //	}
    //	if ((cfg1.h_1 < 0) || (cfg1.h_1 > 2)) {
    //		console.log("h_1 invalid : " + cfg1.h_1);
    //		return -1;
    //	}
    if (0 == cfg1.cont_1.localeCompare("")) {
        console.log("cont_1 invalid : " + cfg1.cont_1);
        return -1;
    }
    if ((cfg1.show_1 < 0) || (cfg1.show_1 > 1)) {
        console.log("show_1 invalid : " + cfg1.show_1);
        return -1;
    }



    return 0;
}
function isRecordCfgValid(cfg1) {

    if ((cfg1.recordCh011.startTimerRec < 0) || (cfg1.recordCh011.startTimerRec > 1)) {
        console.log("recordCh011.startTimerRec invalid : " + cfg1.recordCh011.startTimerRec);
        return -1;
    }
    if ((cfg1.recordCh011.startManualRec < 0) || (cfg1.recordCh011.startManualRec > 1)) {
        console.log("recordCh011.startManualRec invalid : " + cfg1.recordCh011.startManualRec);
        return -1;
    }
    if ((cfg1.recordCh011.singlefiletime < 30) || (cfg1.recordCh011.singlefiletime > 600)) {
        console.log("recordCh011.singlefiletime invalid : " + cfg1.recordCh011.singlefiletime);
        return -1;
    }
    if ((cfg1.recordCh011.enable < 0) || (cfg1.recordCh011.enable > 1)) {
        console.log("recordCh011.enable invalid : " + cfg1.recordCh011.enable);
        return -1;
    }
    if (0 == cfg1.recordCh011.filepath.localeCompare("")) {
        console.log("recordCh011.filepath invalid : " + cfg1.recordCh011.filepath);
        return -1;
    }


    if ((cfg1.recordCh011.startTimerRec < 0) || (cfg1.recordCh011.startTimerRec > 1)) {
        console.log("recordCh011.startTimerRec invalid : " + cfg1.recordCh011.startTimerRec);
        return -1;
    }
    if ((cfg1.recordCh011.startManualRec < 0) || (cfg1.recordCh011.startManualRec > 1)) {
        console.log("recordCh011.startManualRec invalid : " + cfg1.recordCh011.startManualRec);
        return -1;
    }
    if ((cfg1.recordCh011.singlefiletime < 30) || (cfg1.recordCh011.singlefiletime > 600)) {
        console.log("recordCh011.singlefiletime invalid : " + cfg1.recordCh011.singlefiletime);
        return -1;
    }
    if ((cfg1.recordCh011.enable < 0) || (cfg1.recordCh011.enable > 1)) {
        console.log("recordCh011.enable invalid : " + cfg1.recordCh011.enable);
        return -1;
    }
    if (0 == cfg1.recordCh011.filepath.localeCompare("")) {
        console.log("recordCh011.filepath invalid : " + cfg1.recordCh011.filepath);
        return -1;
    }


    if ((cfg1.recordSch.etm < 0) || (cfg1.recordSch.etm > 2)) {
        console.log("recordSch.etm invalid : " + cfg1.recordSch.etm);
        return -1;
    }
    if (isSchValid(cfg1.recordSch.workday) < 0) {
        console.log("recordSch.workday invalid");
        return -1;
    }
    if (isSchValid(cfg1.recordSch.weekend) < 0) {
        console.log("recordSch.weekend invalid");
        return -1;
    }
    if (isSchValid(cfg1.recordSch.sun) < 0) {
        console.log("recordSch.sun invalid");
        return -1;
    }
    if (isSchValid(cfg1.recordSch.mon) < 0) {
        console.log("recordSch.mon invalid");
        return -1;
    }
    if (isSchValid(cfg1.recordSch.tue) < 0) {
        console.log("recordSch.tue invalid");
        return -1;
    }
    if (isSchValid(cfg1.recordSch.wed) < 0) {
        console.log("recordSch.wed invalid");
        return -1;
    }
    if (isSchValid(cfg1.recordSch.thu) < 0) {
        console.log("recordSch.thu invalid");
        return -1;
    }
    if (isSchValid(cfg1.recordSch.fri) < 0) {
        console.log("recordSch.fri invalid");
        return -1;
    }
    if (isSchValid(cfg1.recordSch.sat) < 0) {
        console.log("recordSch.sat invalid");
        return -1;
    }


    //	if ((cfg1.rectime < 15) || (cfg1.rectime > 180)) {
    //		console.log("rectime invalid : " + cfg1.rectime);
    //		return -1;
    //	}

    return 0;
}

function isSchValid(old) {
    var i;


    for (i = 0; i < 3; i++) {
        if ((old[i][0] < 0) || (old[i][0] > 99)) {
            console.log("Sch invalid[0] : " + old[i][0]);
            return -1;
        }

        if ((old[i][1] < -1) || (old[i][1] > 98)) {
            console.log("Sch invalid[1] : " + old[i][1]);
            return -1;
        }
    }

    return 0;
}

function isImageCfgValid(cfg1) {
    //@TODO : Pravin, this validation may be incorrect
    if (0 != (cfg1.devno)) {
        console.log("devno invalid : " + cfg1.devno);
        return -1;
    }
    //@TODO : Pravin, this validation may be incorrect
    if (0 != (cfg1.chn)) {
        console.log("chn invalid : " + cfg1.chn);
        return -1;
    }
    if ((cfg1.flip < 0) || (cfg1.flip > 1)) {
        console.log("flip invalid : " + cfg1.flip);
        return -1;
    }
    if ((cfg1.mirror < 0) || (cfg1.mirror > 1)) {
        console.log("mirror invalid : " + cfg1.mirror);
        return -1;
    }
    if ((cfg1.wdr < 0) || (cfg1.wdr > 4)) {
        console.log("wdr invalid : " + cfg1.wdr);
        return -1;
    }


    return 0;
}
function isMdCfgValid(cfg1) {
    if ((cfg1.md_email_switch < 0) || (cfg1.md_email_switch > 1)) {
        console.log("md_email_switch invalid : " + cfg1.md_email_switch);
        return -1;
    }
    if ((cfg1.md_snap_switch < 0) || (cfg1.md_snap_switch > 1)) {
        console.log("md_snap_switch invalid : " + cfg1.md_snap_switch);
        return -1;
    }
    if ((cfg1.md_emailsnap_switch < 0) || (cfg1.md_emailsnap_switch > 1)) {
        console.log("md_emailsnap_switch invalid : " + cfg1.md_emailsnap_switch);
        return -1;
    }
    if ((cfg1.md_ftpsnap_switch < 0) || (cfg1.md_ftpsnap_switch > 1)) {
        console.log("md_ftpsnap_switch invalid : " + cfg1.md_ftpsnap_switch);
        return -1;
    }

    if ((cfg1.md_record_switch < 0) || (cfg1.md_record_switch > 1)) {
        console.log("md_record_switch invalid : " + cfg1.md_record_switch);
        return -1;
    }
    if ((cfg1.md_ftprec_switch < 0) || (cfg1.md_ftprec_switch > 1)) {
        console.log("md_ftprec_switch invalid : " + cfg1.md_ftprec_switch);
        return -1;
    }

    if ((cfg1.md_ioalmdo_switch < 0) || (cfg1.md_ioalmdo_switch > 1)) {
        console.log("md_ioalmdo_switch invalid : " + cfg1.md_ioalmdo_switch);
        return -1;
    }

    //@TODO : Pravin, this range may be invalid
    if ((cfg1.etm < 0) || (cfg1.etm > 2)) {
        console.log("etm invalid : " + cfg1.etm);
        return -1;
    }
    //@TODO : Pravin, this range may be invalid
    if ((cfg1.workday < 0) || (cfg1.workday > 100)) {
        console.log("workday invalid : " + cfg1.workday);
        return -1;
    }
    //@TODO : Pravin, this range may be invalid
    if ((cfg1.weekend < 0) || (cfg1.weekend > 100)) {
        console.log("weekend invalid : " + cfg1.weekend);
        return -1;
    }
    if ((cfg1.md_interval < 10) || (cfg1.md_interval > 3600)) {
        console.log("md_interval invalid : " + cfg1.md_interval);
        return -1;
    }

    if ((cfg1.MdbEnable < 0) || (cfg1.MdbEnable > 1)) {
        console.log("MdbEnable invalid : " + cfg1.MdbEnable);
        return -1;
    }
    if ((cfg1.MdSensitiValue < 0) || (cfg1.MdSensitiValue > 3)) {
        console.log("MdSensitiValue invalid : " + cfg1.MdSensitiValue);
        return -1;
    }
    //@TODO : Pravin, this range may be invalid
    if ((cfg1.MDThresholdValue < 0) || (cfg1.MDThresholdValue > 100)) {
        console.log("MDThresholdValue invalid : " + cfg1.MDThresholdValue);
        return -1;
    }
    if ((cfg1.MdInterval < 10) || (cfg1.MdInterval > 3600)) {
        console.log("MdInterval invalid : " + cfg1.MdInterval);
        return -1;
    }
    var i;
    for (i = 0; i < 32; i++) {
        if ((cfg1.MdRegion[i] < 0) || (cfg1.MdRegion[i] > 255)) {
            console.log("MdRegion[" + i + "] invalid : " + cfg1.MdRegion[i]);
            return -1;
        }
    }

    if ((cfg1.md_alarm < 0) || (cfg1.md_alarm > 1)) {
        console.log("md_alarm invalid : " + cfg1.md_alarm);
        return -1;
    }
    //@TODO : Pravin, this range may be invalid
    if ((cfg1.defend_alarm < 0) || (cfg1.defend_alarm > 100)) {
        console.log("defend_alarm invalid : " + cfg1.defend_alarm);
        return -1;
    }
    //@TODO : Pravin, this range may be invalid
    if ((cfg1.tc_alarm < 0) || (cfg1.tc_alarm > 100)) {
        console.log("tc_alarm invalid : " + cfg1.tc_alarm);
        return -1;
    }


    return 0;
}

function isDevInfoValid(cfg1) {
    if ((cfg1.hwVer < 0) || (cfg1.hwVer > 100)) {
        console.log("hwVer invalid : " + cfg1.hwVer);
        return -1;
    }
    if ((cfg1.swVer < 0) || (cfg1.swVer > 100)) {
        console.log("swVer invalid : " + cfg1.swVer);
        return -1;
    }
    if ((cfg1.provisioningVer < 0) || (cfg1.provisioningVer > 100)) {
        console.log("provisioningVer invalid : " + cfg1.provisioningVer);
        return -1;
    }
    if ((cfg1.publisherVer < 0) || (cfg1.publisherVer > 100)) {
        console.log("publisherVer invalid : " + cfg1.publisherVer);
        return -1;
    }
    if (0 == cfg1.serialNo.localeCompare("")) {
        console.log("serialNo invalid : " + cfg1.serialNo);
        return -1;
    }


    return 0;
}

function isNwInfoValid(cfg1) {
    //	if (0 == cfg1.networktype.localeCompare("")) {
    //		console.log("networktype invalid : " + cfg1.networktype);
    //		return -1;
    //	}
    //	if (0 == cfg1.macaddress.localeCompare("00:00:00:00:00:00")) {
    //		console.log("macaddress invalid : " + cfg1.macaddress);
    //		return -1;
    //	}
    //	if (0 == cfg1.ip.localeCompare("0.0.0.0")) {
    //		console.log("ip invalid : " + cfg1.ip);
    //		return -1;
    //	}
    //	if (0 == cfg1.netmask.localeCompare("0.0.0.0")) {
    //		console.log("netmask invalid : " + cfg1.netmask);
    //		return -1;
    //	}
    //	if (0 == cfg1.gateway.localeCompare("0.0.0.0")) {
    //		console.log("gateway invalid : " + cfg1.gateway);
    //		return -1;
    //	}
    //	if (0 == cfg1.sdnsip.localeCompare("0.0.0.0")) {
    //		console.log("sdnsip invalid : " + cfg1.sdnsip);
    //		return -1;
    //	}
    //	if (0 == cfg1.fdnsip.localeCompare("0.0.0.0")) {
    //		console.log("fdnsip invalid : " + cfg1.fdnsip);
    //		return -1;
    //	}
    //
    return 0;
}


function getDefaultCfg(appSettings) {
    appSettings.uuid = "fooBar";
    appSettings.grUuid = "";

    appSettings.streamCfg.enabled = 0
    appSettings.streamCfg.enableAudio = 0;
    appSettings.streamCfg.publishUrl = "";
    appSettings.streamCfg.mqttUrl = "";
    appSettings.streamCfg.enableTelnet = 0;
    appSettings.streamCfg.telnetUrl = "";
    appSettings.streamCfg.isHd = 0;

    appSettings.timeCfg.time = "1234567890";
    appSettings.timeCfg.tz = "STD:+5:30";
    appSettings.timeCfg.timeZone = "Asia/Kolkata";
    appSettings.timeCfg.dstmode = 1;
    appSettings.timeCfg.autoupdate = 2;
    appSettings.timeCfg.autoupdatetzonvif = 3;
    appSettings.timeCfg.ntpserver = "ntp.server.com";
    appSettings.timeCfg.ntpinterval = 4;
    appSettings.timeCfg.ntpenable = 5;

    appSettings.videoCh011.bps = 1;
    appSettings.videoCh011.fps = 2;
    appSettings.videoCh011.gop = 3;
    appSettings.videoCh011.brmode = 4;
    appSettings.videoCh011.piclevel = 5;
    appSettings.videoCh011.fixqplevel = 6;
    appSettings.videoCh011.width = 7;
    appSettings.videoCh011.height = 8;
    appSettings.videoCh011.bmainstream = 9;
    appSettings.videoCh011.bfield = 10;

    appSettings.videoCh012.bps = 11;
    appSettings.videoCh012.fps = 12;
    appSettings.videoCh012.gop = 13;
    appSettings.videoCh012.brmode = 14;
    appSettings.videoCh012.piclevel = 15;
    appSettings.videoCh012.fixqplevel = 16;
    appSettings.videoCh012.width = 17;
    appSettings.videoCh012.height = 18;
    appSettings.videoCh012.bmainstream = 19;
    appSettings.videoCh012.bfield = 20;

    appSettings.videoCh013.bps = 21;
    appSettings.videoCh013.fps = 22;
    appSettings.videoCh013.gop = 23;
    appSettings.videoCh013.brmode = 24;
    appSettings.videoCh013.piclevel = 25;
    appSettings.videoCh013.fixqplevel = 26;
    appSettings.videoCh013.width = 27;
    appSettings.videoCh013.height = 28;
    appSettings.videoCh013.bmainstream = 29;
    appSettings.videoCh013.bfield = 30;

    appSettings.emailCfg.emailserver = "smtp.mail.com";
    appSettings.emailCfg.emailport = 1;
    appSettings.emailCfg.ssl = 2;
    appSettings.emailCfg.logintype = 3;

    appSettings.emailCfg.emailusername = "alerts@ambicam.com";
    appSettings.emailCfg.emailpassword = "";
    appSettings.emailCfg.from = "alerts@ambicam.com";

    appSettings.emailCfg.to = "info@vmukti.com";
    appSettings.emailCfg.subject = "mysubject";
    appSettings.emailCfg.text = "your text";
    appSettings.emailCfg.attatchment = "This is attachement";

    appSettings.displayCfg.hue = 50;
    appSettings.displayCfg.brightness = 50;
    appSettings.displayCfg.saturation = 50;
    appSettings.displayCfg.contrast = 50;
    appSettings.displayCfg.ircutmode = 1;

    appSettings.osdCfg.rgncnt = 1;
    appSettings.osdCfg.fontsize = 2;
    appSettings.osdCfg.x_0 = 3;
    appSettings.osdCfg.y_0 = 4;
    appSettings.osdCfg.w_0 = 5;
    appSettings.osdCfg.h_0 = 6;
    appSettings.osdCfg.cont_0 = "This is time";
    appSettings.osdCfg.show_0 = 7;
    appSettings.osdCfg.x_1 = 8;
    appSettings.osdCfg.y_1 = 9;
    appSettings.osdCfg.w_1 = 10;
    appSettings.osdCfg.h_1 = 11;
    appSettings.osdCfg.cont_1 = "VMukti VCAM";
    appSettings.osdCfg.show_1 = 12;

    appSettings.imageCfg.devno = 22;
    appSettings.imageCfg.chn = 23;
    appSettings.imageCfg.flip = 24;
    appSettings.imageCfg.mirror = 26;
    appSettings.imageCfg.wdr = 27;

    appSettings.recordCh011.startTimerRec = 88;
    appSettings.recordCh011.startManualRec = 89;
    appSettings.recordCh011.singlefiletime = 90;
    appSettings.recordCh011.enable = 91;
    appSettings.recordCh011.filepath = "/home/pravin/vmukti/rec1";
    appSettings.recordCh012.startTimerRec = 92;
    appSettings.recordCh012.startManualRec = 93;
    appSettings.recordCh012.singlefiletime = 94;
    appSettings.recordCh012.enable = 95;
    appSettings.recordCh012.filepath = "/home/pravin/vmukti/rec2";
    appSettings.recordSch.workday = new Array(-1, -1, -1, -1, -1, -1);
    appSettings.recordSch.weekend = new Array(-1, -1, -1, -1, -1, -1);
    appSettings.recordSch.sun = new Array(-1, -1, -1, -1, -1, -1);
    appSettings.recordSch.mon = new Array(-1, -1, -1, -1, -1, -1);
    appSettings.recordSch.tue = new Array(-1, -1, -1, -1, -1, -1);
    appSettings.recordSch.wed = new Array(-1, -1, -1, -1, -1, -1);
    appSettings.recordSch.thu = new Array(-1, -1, -1, -1, -1, -1);
    appSettings.recordSch.fri = new Array(-1, -1, -1, -1, -1, -1);
    appSettings.recordSch.sat = new Array(-1, -1, -1, -1, -1, -1);
    appSettings.rectime = 96;

    appSettings.mdCfg.md_email_switch = 0;
    appSettings.mdCfg.md_snap_switch = 0;
    appSettings.mdCfg.md_emailsnap_switch = 0;
    appSettings.mdCfg.md_ftpsnap_switch = 0;
    appSettings.mdCfg.md_record_switch = 0;
    appSettings.mdCfg.md_ftprec_switch = 0;
    appSettings.mdCfg.md_ioalmdo_switch = 0;
    appSettings.mdCfg.etm = 0;
    appSettings.mdCfg.workday = 0;
    appSettings.mdCfg.weekend = 0;
    appSettings.mdCfg.md_interval = 5;
    appSettings.mdCfg.MdbEnable = 0;
    appSettings.mdCfg.MdSensitiValue = 10;
    appSettings.mdCfg.MDThresholdValue = 10;
    appSettings.mdCfg.MdInterval = 5;
    appSettings.mdCfg.MdRegion = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    appSettings.mdCfg.md_alarm = 0;
    appSettings.mdCfg.defend_alarm = 0;
    appSettings.mdCfg.tc_alarm = 0;

    appSettings.devInfo.hwVer = 0;
    appSettings.devInfo.swVer = 0;
    appSettings.devInfo.provisioningVer = 0;
    appSettings.devInfo.publisherVer = 0;
    appSettings.devInfo.serialNo = "";

    appSettings.nwInfo.networktype = "";
    appSettings.nwInfo.macaddress = "";
    appSettings.nwInfo.ip = "";
    appSettings.nwInfo.netmask = "";
    appSettings.nwInfo.gateway = "";
    appSettings.nwInfo.sdnsip = "";
    appSettings.nwInfo.fdnsip = "";
}

module.exports = {
    VUtil_decodeGetConfigMsg,
    getDefaultSettings,
    VUtil_packInt,
    VUtil_encodeMsgHeader,
    VUtil_getStreamId,
    VUtil_decodeMsgHeader,
    VUtil_getStringFromBuff,
    VUtil_encodeMsg
}