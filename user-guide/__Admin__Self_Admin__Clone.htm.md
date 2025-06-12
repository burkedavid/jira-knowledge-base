Clone workspace

Click here to see this page in full context

####  Clone workspace

Instead of creating a new, empty workspace and adding all of the
administrators, users and other project details, you can create a copy of the
workspace you are currently in and change the details. This is known as
cloning the workspace.

Note  If the workspace is configured to contain both constraint pick lists and
filename recognition, the filename recognition module must be disabled before
making the clone and enabled again after making the clone (on both the clone
and the original workspace). Contact Idox support.

Note  Documents are not carried forward into a cloned workspace. Neither are
deactivated categories.

Note  The default viewer is carried forward into a cloned workspace.Â

Note  The clone cannot be canceled after step 6 of this procedure.

  1. In the Self Administration pane, select Clone Workspace. 
  2. Enter the following details: 

SettingÂ Â Â  |  Description   
---|---  
Workspace Name  |  The name of the workspace.   
Workspace LocationÂ  |  The geographical location.   
Workspace Description  |  A short description of the purpose of the workspace.   
Workspace Start DateÂ  |  The date on which the workspace will be available for use.   
Workspace End DateÂ  |  The date on which the workspace will terminate.   
Workspace StatusÂ  |  Rollout by default.   
Workspace TypeÂ  |  Standard - workspace can be used fully by all users   
Training - workspace is used for training purposes  
Trial - workspace is used in a limited form to test usage  
Internal - workspace can only be used by members of your company  
Workspace CurrencyÂ  |  Select the unit of currency used within the workspace.   
Create System Groups In  |  Select the language used within the workspace.   
Owning Company  |  The company of the user creating the clone.   
Support OfficeÂ  |  Select the location of the support office.   
  
Â

  1. If you want a company or project logo to appear for the new workspace, contact Idox Support to import the logo.Â  Note  Logo image must conform to the following: 

Parameter  |  Description   
---|---  
File type  |  JPG, JPEG, GIF, PNG   
File sizeÂ  |  Less than 10KB   
Image dimensions  |  145 maximum horizontal pixels x 60 maximum vertical pixels   
Background  |  For best results the image background should be transparent.   
  
Â

  1. In the Workspace Home Page section you can choose which of the information pages to display on the homepage. Check the boxes for the options you want to display. 
  2. Configure the limitations you want to impose on email out for this workspace. 

Setting  |  Description   
---|---  
Max Number Of Email Out RecipientsÂ  |  The maximum number of email out recipients a user can add to an outgoing email.   
Max Total Attachment SizeÂ Â  |  The maximum size of attachment (in KB).   
Max External Attachment Lifetime  |  The length of time that an attachment can be accessed by link after being sent on an external email.   
  
  

  1. Press Next. 
  2. To add users to the new workspace, select them in the Available Companies/Users list and press Add. To remove users from the Selected Users list, select them and press Remove. 

When you are finished adding and removing users, press Next.

  1. To add user groups to the new workspace, select them in the Available Groups list and press Add. To remove user groups from the Selected Groups list, select them and press Remove. 

When you are finished adding and removing user groups, press Next.

  1. The roles in the current workspace are all listed as selected. Uncheck the boxes of any roles whose members you do not want to copy into the new workspace. Then press Next. 
  2. Code tables in the current workspace are listed. Check the boxes of all the code tables that you want to copy into the new workspace, then press Next. 
  3. The activated Document Categories in the current workspace are listed. Check the boxes of all the categories that you want to copy into the new workspace, then press Next. 
  4. If the Deliverables Management module is enabled, deliverables details and contract details are listed. Check the boxes of all the deliverables and contract detail types that you want to copy into the new workspace, then press Next. 
  5. If the Business Process Management module is enabled, any business processes available for use in the current workspace are listed. Check the boxes of all business processes that you want to copy into the new workspace, then press Next. 
  6. If the Issue Management module is enabled, check the boxes of the issue configuration properties that you want to copy to the new workspace. 
  7. If you want to copy the document folder structure of the current workspace into the new one, check the Copy Folders box. 
  8. Press Finish.Â 

If you have selected to copy the document folder structure, these folders will
be created overnight and an email notification will be sent when it is
complete.

Note If the workspace contains a custom category field configured to use a
code table, verify that the field is correctly configured to use the code
table in the Category Admin of the new workspace. If the custom field does not
show the Link To Table setting with the correct code table, the field must be
deactivated, removed and re-added (before any documents are created in the
category).

The following settings are not cloned and must be manually applied:

Settings not cloned  |  Â   
---|---  
Transmittal configurationsÂ Â  |  Â   
Workspace Information, Bulletins and Images  |  Â   
Workspace DetailsÂ  |  Â   
Hide on Upload setting for category propertiesÂ Â  |  Â   
Distribution CodesÂ  |  Â   
Activity RemindersÂ  |  Â   
BI Metadata Settings and BI Numbering Settings  |  Â   
Site Office address  |  Â   
Deliverables Management Default Submittal Recipients  |  Â   
Deliverables Management Review Types  |  Â   
Deliverables Management Review Configurations settings  |  Â   
Submittal Numbering  |  Â   
Companies (if users from the company are not cloned)  |  Â   
The following Role memberships:  |  Super administrators   
Â  |  Group administrators   
Â  |  BI administrators   
Â  |  Tag roles   
Â  |  Transmittal administrators   
Â  |  Package administration roles   
Â  |  Restricted users   
Rendition TemplatesÂ  |  Â   
Tag Settings  |  Tag Classification and Tag Data Type code table values.   
Â  |  Â   
Â  |  Â   
  
Â

