Sub-project synch

Click here to see this page in full context

#####  Sub-project synchronization

Synchronization allows you connect a template to selected sub-projects created
from that template, so that any changes made in the template are also made in
those sub-projects. For this reason, the synchronization tab cannot be set up
until you have created at least one sub-project to link it to.

When you request synchronization between a template and one or more sub-
projects, the request is queued to be run over night when system traffic is
low and project updates can be performed safely. Once the synchronization has
been run, a report is generated detailing success or failure. Failure may
occur for a number of reasons, for example: when a new folder name in the
template already exists in the workspace or when an existing folder deleted
from the template still contains documents in a sub-project.

  1. Set up one or more sub-projects in the document folder structure using the template you have created (see [ Sub-projects ](../../Documents/Sub-proj.htm#h) ). 
  2. In the Administration page, open the Project Settings pane and select Manage Project Templates. 
  3. Select the project template you want to manage and click on its Preferences button. 
  4. Open the Synchronization tab and press the New Synchronization Request button. 
  5. The top half of the screen displays the Available Projects (sub-projects created using this template). If there are a lot of projects, you can enter information into the filter fields to help locate the projects you want. 
  6. Select the sub-projects you want to synchronism the template with, then press Copy to move them to the Selected Projects pane at the bottom. You can remove projects by selecting them and pressing Remove. 
  7. Enter any useful information in the comments box. 
  8. Press the Submit Synchronization Request button. 
  9. To view a summary report of a completed synchronization request, press the Preferences button. Press Preferences for a specific sub-project to view its details.Â 

The report contains a number of log entries detailing either success or
reasons for failure for the objects being synchronized (for example, folders
or tasks).

Log TypeÂ  |  Description   
---|---  
Info  |  Synchronization was successful.   
Warn  |  Synchronization was performed but with errors.   
Error  |  Synchronization could not be performed.   
  
  

  1. You can cancel a synchronization request by selecting it and pressing the Cancel Request button. 
  2. You can remove a synchronization request from the template by selecting it and pressing the Remove Request button. 

