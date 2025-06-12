Edit reference field

Click here to see this page in full context

#####  Edit Reference field

The Reference system property field allows you to configure the format of the
automatically generated document reference number. The reference number is
constructed from parts and separators.

Note  The category must be deactivated to edit the reference.

Note  You can Edit, Remove or Move Parts in a reference number at any time
until it is used to upload documents.

Note  If your reference field is going to refer to a code table, this must be
set up first before the reference field can be created (see [ Manage Code
Tables ](Manage.htm#h) ).Â

![](../../images/reference numbering.png)

For example, for a category which will be used with different kinds of drawing
files, you might want the automatic reference numbering to differentiate
between the drawing types and also incorporate the upload date. In this case,
the reference number may be made of three parts (divided by / separators).

  * DRAWTYPE - a Selection part that allows the user to choose the drawing type during the upload process. 
  * UPLOADED - a Date part that allows the user to choose the date of upload, in the format DDMMYY. 
  * COUNT - a Counter part that allows the user to select the next sequential number. The sequential counts are counted independently for each drawing type. 

When the user uploads documents into this category, the resultant reference
numbers may be something like: PLA/010115/0101, PLA/050115/0102,
DWG/110115/0012, SCH/230115/0429.

IMPORTANT  You cannot edit a reference number once documents have been created
(even if the documents are deleted).

  1. In the Manage Document Fields tab, press the Preferences button for the Reference property. 
  2. If the category is deactivated and has not yet been used to upload documents, you can add, remove and configure the order of parts to create the reference number format. To add a part to the reference number, press the Insert Part button and select its location in the reference number, relative to any other parts.Â 
  3. Select the Part type: 

Part type  |  Description  |  Instructions   
---|---|---  
Separator  |  Characters which delineate the parts of the reference number. Separators may consist of one or two characters. They can be any type of character, but most often are symbol characters. For example - / [ ] .  |  Enter the characters that you want to be used for this separator part.Â   
When Filename Recognition is enabled, separators must be used between the
numbering parts for filename recognition to identify them.  
In filename recognition, the download process uses an underscore between the
number and the revision (see [ Create a document category
](Category_adm.htm#h1) ). Choose a different separator for the reference
number.  
Code Table  |  Allows users to select from the options in a code table that is available for use in your workspace.  |  Enter the Name of the part.   
Select the Code Table from which the options will be chosen.  
Selection  |  Allows the part to be determined by user input, involving options that you supply manually. The options are presented in the order listed here. You can change the order, as well as add or remove options.Â  |  Enter the Name of the part.   
Add an Entry for each option that users will be able to select for this part.
Each entry has a Code and a Label. The code is used in the reference number.
The label is the option text presented to the user.  
Use the Up and Down buttons to change the position of an option.  
Free Text  |  Allows users to enter a piece of text as part of the reference number. You define the length of the free text and provide a default string.   
Optionally, you can choose to standardize the entered text by converting to all uppercase or lower case. The default is to leave the text as entered.  |  Enter the Name of the part.   
Enter the minimum and maximum character lengths that the entered text can be
in the Min Length and Max Length fields.  
Enter a Default Value for the displayed free text string.  
Select the text conversion Option.  
Date  |  Allows users to select a relevant date to form part of the reference number. You can select the date format from a range of options.Â Â  |  Enter the Name of the part.   
Choose one Date Format from the examples. If you choose Custom, you can enter
your own combination of DD, MM and YY.  
Counter  |  Provides a sequential count to ensure that all reference numbers are unique.Â   
The counter can be configured to count differently according to the selections of other parts of the reference number. For example, three types of drawing chosen from a Selection part may each have their own sequential count. You can choose the parts that cause a counter reset in this way.  |  Enter the name of the part.   
Enter the number of digits in the counter.  
Enter the number at which the counter should start.  
Enter the number at which the counter should end.  
Choose whether the counter should display leading zeros.  
Choose which parts of the reference number cause a counter reset.  
  
Â Â Â Â Â Â  
Â While configuring each part, press Apply.

  1. Once a reference number is in use, you can edit some of the details of a part. Select that part and press the Edit Part button. 
  2. Once you have finished configuring your reference number, press Apply. 

