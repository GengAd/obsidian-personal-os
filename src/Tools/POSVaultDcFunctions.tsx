import { App } from "obsidian";
//import { h, JSX, render } from "preact";
//import { useState } from "preact/hooks";
import { MissionProgressBar } from "src/Tools/POSVaultComponent/MissionProgressBar";
import { ActivityOutline } from "src/Tools/POSVaultComponent/ActivityOutline";
import { AvailableMissions } from "src/Tools/POSVaultComponent/AvailableMissions";
import { CompleteActivity } from "src/Tools/POSVaultComponent/CompleteActivity";
import { CurrentMissionList } from "src/Tools/POSVaultComponent/CurrentMissionList";
import { MissionGallery } from "src/Tools/POSVaultComponent/MissionGallery";
import { OngoingMission } from "src/Tools/POSVaultComponent/OngoingMission";
import { UnavailableMissions } from "src/Tools/POSVaultComponent/UnavailableMissions";
import { TimedCount, DueCount, ScheduledCount, NextCount, HandledCount, FutureCount, LateCount, ToProcessCount } from "src/Tools/POSVaultComponent/ActionsCounts";
import { BuffBar, DebuffBar } from "src/Tools/POSVaultComponent/BuffAndDebuffBars";
import { LinkedFilesWithClassFilter } from "src/Tools/POSVaultComponent/LinkedFilesWithClassFilter";
import { TimedList, DueList, ScheduledList, NextList, HandledList, FutureList, LateList, ToProcessList } from "src/Tools/POSVaultComponent/SubjectLists";
import { OpenCurrentButton } from "src/Tools/POSVaultComponent/OpenCurrentButton";
import { TodayProgressBar } from "src/Tools/POSVaultComponent/TodayProgressBar";
import { RequirementProgressBar } from "src/Tools/POSVaultComponent/RequirementProgressBar";
import { TotalXP, CharacterLevel, CurrentLevelXPBar } from "src/Tools/POSVaultComponent/PointsAndXP";
import { GlobalStreak } from "src/Tools/POSVaultComponent/GlobalStreaks";
import { RoutineStreak } from "src/Tools/POSVaultComponent/RoutineStreak";
import { GenerateAllTemplatesButton } from "src/Tools/POSVaultComponent/GenerateAllTemplatesButton";
import { ActionStreak } from "src/Tools/POSVaultComponent/ActionStreak";
import { CompletedMissionList, CompletedMissionTemplateList } from "src/Tools/POSVaultComponent/MissionHistory";
import { OntologyTreeViewer } from "src/Tools/POSVaultComponent/OntologyTree";
import { ClassEntityList } from "src/Tools/POSVaultComponent/ClassEntityList";
import { SubClassTree } from "src/Tools/POSVaultComponent/SubClassTree";
import { MetaClassTree } from "src/Tools/POSVaultComponent/MetaClassTree";


export class POSVaultDcFunctions {
    app: App;
    constructor(app: App) {
        this.app = app;
    }
    
    ActivityOutline = ActivityOutline;
    AvailableMissions = AvailableMissions;
    CompleteActivity = CompleteActivity;
    CurrentMissionList = CurrentMissionList;
    MissionGallery = MissionGallery;
    MissionProgressBar =  MissionProgressBar;
    TodayProgressBar = TodayProgressBar;
    OngoingMission = OngoingMission;
    UnavailableMissions = UnavailableMissions;
    RequirementProgressBar = RequirementProgressBar;
    OpenCurrentButton = OpenCurrentButton;
  
    // Count components for Datacore
    TimedCount = TimedCount;
    DueCount = DueCount;
    ScheduledCount = ScheduledCount;
    NextCount = NextCount;
    HandledCount = HandledCount;
    FutureCount = FutureCount;
    LateCount = LateCount;
    ToProcessCount = ToProcessCount;
  
    // List components for Datacore
    TimedList = TimedList;
    DueList = DueList;
    ScheduledList = ScheduledList;
    NextList = NextList;
    HandledList = HandledList;
    FutureList = FutureList;
    LateList = LateList;
    ToProcessList = ToProcessList;
    CompletedMissionList = CompletedMissionList;
    CompletedMissionTemplateList = CompletedMissionTemplateList;
  
    BuffBar = BuffBar;
    DebuffBar = DebuffBar;
    LinkedFilesWithClassFilter = LinkedFilesWithClassFilter;
    ClassEntityList = ClassEntityList;

    // XP/Level components
    TotalXP = TotalXP;
    CharacterLevel = CharacterLevel;
    CurrentLevelXPBar = CurrentLevelXPBar;
    GlobalStreak = GlobalStreak;
    RoutineStreak = RoutineStreak;
    ActionStreak = ActionStreak;
    GenerateAllTemplatesButton = GenerateAllTemplatesButton;

    OntologyTreeViewer = OntologyTreeViewer;
    SubClassTree = SubClassTree;
    MetaClassTree = MetaClassTree;
}


