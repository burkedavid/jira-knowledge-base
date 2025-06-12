Alert configuration

Click here to see this page in full context

###  Alert Configuration

For transmittals and formal reviews you can configure the information included
in the notification subject line to allow alert recipients to quickly
understand the purpose of the notification. This is done by adding relevant
metadata field tokens for the notification subject line. When the alert
notification is generated the tokens are replaced by the field content
relevant to the selected activity and action.

####  Create an alert configuration

You can create one activity alert configuration for the following combinations
of activity and action.

ActivityÂ Â Â  |  Action  |  Description   
---|---|---  
Transmittal  |  New  |  Alert issued when a new standard or issue transmittal is sent to the recipient.   
Formal ReviewÂ  |  New  |  Alert issued when a new formal review is sent to the recipient as lead reviewer, consolidator, commenter or for information.   
Formal Review  |  Close  |  Alert issued when a formal review in which the recipient was involved is closed.   
  
Â Â Â

  1. In the Workspace Settings panel, select Alert Configuration. 
  2. Press Add to create a new configuration. 
  3. Select the Activity from the drop-down menu. 
  4. Select the Action relevant to the selected activity from the drop-down menu. 
  5. The Tokens drop-down menu is populated with metadata field tokens relevant to the combination of activity and action selected.Â 

Token  |  Description   
---|---  
Action  |  The selected action: New or Close.   
ActivityName  |  The name of the activity: Transmittal or Formal Review.   
ActivityReferenceÂ  |  The activity reference number.   
ActivitySubjectÂ  |  The formal review Subject or transmittal Short Description.   
DecisionCode  |  The decision code attached the document during formal review.   
Documents  |  The document reference number.Â   
DueDateÂ  |  The due date specific to the userâs role in the activity.Â   
For transmittals, this is the Reply Due Date defined in the transmittal print
layout (see [ Edit Transmittal Print Layout ](../Company/Edit_Trans.htm#h) ).  
For formal reviews, this will be the Planned Review date.  
PmStatus  |  The PM lifecycle status of the document.   
Purpose  |  The reason the formal review is being sent to a user: for lead review, for consolidation, for comment or for information.   
ReviewType  |  The formal review type.   
Sender  |  The name of the sender.   
WorkspaceName  |  The name of the workspace.   
  
  
Â Â  
Select one or more tokens. In the Subject Preview box, arrange the tokens in
the order you want them to appear in the subject line of the notification. Add
text as well, if required.

Note  The maximum length of the subject field is 256 characters. It is
important to bear this in mind especially when using tokens that may convert
to long strings.

  1. Press the Create button. 

