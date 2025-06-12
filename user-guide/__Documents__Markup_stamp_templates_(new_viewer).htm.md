Markup stamps (new viewer)

Click here to see this page in full context

####  Markup stamps

Annotations that are frequently used in markups can be saved as custom stamp
templates which can be applied using the Stamp tool. Markup stamps are
available to all users in the workspace.

#####  Create a stamp template

Markup stamps can be created and edited by Document Controllers or Workspace
Administrators and may consist of one or more markup elements. When the stamp
is used the content or arrangement of the elements that make up the stamp
cannot be changed.

Note  To ensure clarity, if the stamp template contains image components they
should not be resized while creating the stamp template. Users of the stamp
will be able to resize it as required.

  1. Open a document in the Viewer. 
  2. Select the Stamp Template tab in the left hand panel to display the stamp templates in your workspace. 
  3. Click on the Create Stamp Template button. 
  4. Add one or more text, image or drawing annotations and arrange them as required. 

Note  At present only the following annotation types can be included in a
stamp template.

Annotation  |  Description   
---|---  
Free text  |  Any text added using the Free Text annotation tool, including dynamic tokens.   
Rectangle  |  Any rectangle added from the Shapes menu.   
Image  |  Any PNG image added via the Insert menu.  Note  The background layer must be transparent.   
Note  Do not resize images while creating the stamp template.  
  
Â

  1. You can add dynamic tokens to a free text annotation that will be replaced by the relevant data when the custom stamp is added to a markup layer. Note Only one dynamic token can be added to a stamp. 

Dynamic Token  |  Description   
---|---  
##DATE##Â  |  The current date according to the location and timezone. Date format is also determined by timezone.   
##TIME##Â  |  The current time according to the local timezone. Time format is also determined by location and timezone.   
##DATETIME##Â  |  The current date and time according to the location and timezone. Date and time format are determined by location and timezone.   
##UTCDATE##  |  The current date in UTC format (YYYY-MM-DD).   
##SYSDATEPLUSDAYS(x)##Â  |  The FusionLive system date plus a specified number of days (x). For example, ##SYSDATEPLUS(2)## would display the system date plus 2 days).   
##TITLE##  |  The document title.   
##PAGE##Â Â  |  The current page number of the document on which the annotation is added.   
##TOTALPAGES##Â  |  The total number of pages in the document.   
##LOGIN## or ##USER##  |  Either of these options returns the name of logged in user.   
##HOSTNAME##  |  The domain name.   
  
Â

  1. Click on Save Stamp Template.Â 
  2. Enter a name for the stamp template and press Save. The stamp will be added to the Stamp Template list and will appear in the Custom list when selecting a stamp to use. 

Â

Watch the FusionLive training video.

Â

