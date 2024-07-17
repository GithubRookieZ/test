var callbackTaskExist = undefined;
var allTaskFinished = undefined;
var callbackTaskFinished = undefined;
function onClick() {

  {
    // 回退任务是否存在/是否完成
    var glideRecord = new GlideRecord('change_task');
    glideRecord.addQuery('change_request',g_form.getValue('sys_id'));
    glideRecord.query();
    while(glideRecord.next()) {
      console.log('short_description: '+glideRecord.getValue('short_description'));
      if((glideRecord.getValue('short_description')+'').startsWith('回退任务')) {
        callbackTaskExist = true;
        if(glideRecord.getValue('state')+'' != '3' && glideRecord.getValue('state')+'' != '4') {
          callbackTaskFinished = false;
        }
      }
    }
    if(callbackTaskExist == undefined) callbackTaskExist = false;
    if(callbackTaskFinished == undefined) callbackTaskFinished = true;
  }
  {
    var gr = new GlideRecord('change_task');
    gr.addQuery('change_request',g_form.getValue('sys_id'));
    gr.query();
    while(gr.next()) {
      // 事件状态为 取消、关闭 才视为完成
      if(gr.getValue('state') != '3' && gr.getValue('state') != '4') {
        allTaskFinished = false;
        break;
      }
    }
    if(allTaskFinished == undefined) allTaskFinished = true;
  }
  waitForResult(callbackTaskExist, allTaskFinished, callbackTaskFinished);
}
function waitForResult() {
  if(callbackTaskExist == undefined || allTaskFinished == undefined || callbackTaskFinished == undefined) {
    setTimeout(()=>{
      console.log('等待中');
      waitForResult();
    },500);
  } else {
    onClickNext();
  }
}

function onClickNext() {
  console.log("回退任务是否存在："+callbackTaskExist)
  console.log("所有任务都完成?"+allTaskFinished)
  console.log("回退任务都完成？"+callbackTaskFinished)
  //根据条件清空清空解决信息
  updateChangeRecord();
  var requestGr = new GlideRecord('change_request');
  requestGr.addQuery('sys_id',g_form.getValue('sys_id'));
  requestGr.query();
  if (requestGr.next()) {
    var db_state = requestGr.getValue('state')+'';
    var new_state = g_form.getValue('state')+'';
    //判断解决信息是否成功
    var close_code = g_form.getValue('close_code');
    // 从实施到实施
    if(db_state == '-1' && new_state == '-1') {
      console.log('从实施到实施');
      if(close_code != 'successful' && !callbackTaskExist) {
        createTask();
        g_notification.show('创建了新的回退任务，请前往变更任务查看。','error');
      }
      updateData();
    }
    // 从实施到评审
    else if(db_state == '-1' && new_state == '0') {
      console.log('从实施到评审');
      if(close_code != 'successful' && !callbackTaskExist) {
        createTask();
        g_form.setValue('state',db_state);
        g_notification.show('创建了新的回退任务，请前往变更任务查看。','error');
      } else if(!allTaskFinished) {
        g_form.setValue('state',db_state);
        g_notification.show('存在尚未完成的变更任务，无法进入评审阶段。','error');
      }
      updateData();
    }
    // 从评审到结案
    else if(db_state == '0' && new_state == '3') {
      console.log('从评审到结案');
      if(!allTaskFinished) {
        g_form.setValue('state',db_state);
        g_notification.show('存在尚未完成的变更任务，无法结案。','error');
      }
      updateData();
    }
    // 其它流程
    else {
      updateData();
    }
  }
  console.log('完成');
}

function createTask() {
  // 创建一个回退任务
  var number = 'automatic_number';
  var sys_id = g_form.getValue('sys_id');
  var assignment_group = g_form.getValue('assignment_group');
  var start_date = g_form.getValue('start_date');
  var end_date = g_form.getValue('end_date');
  var short_description = '回退任务 ' + g_form.getValue('short_description');
  var description = g_form.getValue('description');
  var str = '';
  str += 'number123=321'+number;
  str += '123^321';
  str += 'change_request123=321'+sys_id;
  str += '123^321';
  str += 'change_task_type123=321'+'implementation';
  str += '123^321';
  str += 'state123=321'+'2';
  str += '123^321';
  str += 'assignment_group123=321'+assignment_group;
  str += '123^321';
  str += 'planned_start_date123=321'+start_date;
  str += '123^321';
  str += 'planned_end_date123=321'+end_date;
  str += '123^321';
  str += 'short_description123=321'+short_description;
  str += '123^321';
  str += 'description123=321'+description;

  var ga = new GlideAjax('AJAXGlideRecord');
  ga.addParam('sysparm_name','ajaxProcessor');
  ga.addParam('sysparm_table','change_task');
  ga.addParam('sysparm_type','insert');
  ga.addParam('insert_form',str);
  ga.getJson(response => {console.log(response+'')});
  g_form.setValue('state','-1');
  g_notification.show('存在尚未完成的回退任务，无法进入评审阶段。','error');
}

function updateChangeRecord() {
  //在更新数据之前检查一下是否需要清空
  var list = ['0', '3'];
  var state = g_form.getValue('state');
  // 实施 评审 已结案 不清理，其它的都清理
  if (!list.includes(state)){
    g_form.setValue('close_code', ' ');
    g_form.setValue('close_notes', ' ');
    var gr = new GlideRecord('change_request');
    gr.addQuery('sys_id',g_form.getValue('sys_id'));
    gr.query();
    if(gr.next()) {
      gr.close_code = '';
      gr.close_notes = '';
      gr.update();
    }
  }
}

if (typeof window == 'undefined')
  setRedirect();

function setRedirect() {
  current.update();
  action.setRedirectURL(current);
}

function updateData() {
  gsftSubmit(null, g_form.getFormElement(), "request_update");
}
