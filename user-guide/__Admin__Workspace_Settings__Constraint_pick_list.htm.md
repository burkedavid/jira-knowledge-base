Constraint pick list

Click here to see this page in full context

####  Constraint pick list

FusionLive allows you to place constraints on the options offered in a drop-
down menu of one category field according to the selection made in another.
This is done by creating a Constraint Pick List for each value relationship.Â

Note  Constraint relationships can only be created between properties whose
values are linked to a code table or supplied from a drop-down menu for the
selected category. Code tables used in constraints can be those applied to
metadata fields (META) or used in reference numbering (NUM).

As a very simple example, imagine your category has two drop-down menu fields:
Beverage and Serving Style. You can create constraint pick lists to ensure
that, when uploading documents to this category and providing the document
metadata, only suitable options are presented in the Serving Style menu,
depending on the choice of Beverage.

Beverage optionsÂ  |  Serving Style options  |  Tea constraint pick list  |  Coffee constraint pick list   
---|---|---|---  
Tea  |  with milk  |  with milk  |  black   
Coffee  |  with lemon  |  with lemon  |  espresso   
Â  |  black  |  black  |  latte   
Â  |  espresso  |  Â  |  Â   
Â  |  latte  |  Â  |  Â   
  
Â Â Â Â Â Â Â Â

  1. Open the Category Admin page, locate the category that you want to create a constraint pick list for and click on the Preferences icon. 
  2. Select the Constraint Pick List tab. 
  3. To add a new constraint pick list, press the Create New Constraint button. 

![](../../images/create constraint.png)

  1. Each constraint pick list forms a relationship between one or more field values of a Source property and one or more values of a Target property. Select the property whose values will determine the constraint relationship from the Source Property drop-down menu. Select the property whose values will be constrained by the selection of the source property from the Target Property drop-down menu. 
  2. Select Source Values and then select the corresponding values in the Target Values that will be offered for the Target Property when one of the selected values are chosen in the Source Property. 
  3. Press Apply to create the constraint relationship. You can create further constraints by changing your selections of source and target values and pressing Apply to save each one. 
  4. To edit an existing constraint, locate it by filtering the constraint list according to source or target property names, types or values. Select the constraint and press the Edit Constraint button. Make the appropriate changes and press Apply. 
  5. To delete a constraint, select it in the Constraint Pick List tab and press the Delete Constraint button. 

