#addin "nuget:?package=Cake.SquareLogo"

Task("Publish").Does(() => {
    StartProcess("vsce", new ProcessSettings {
        Arguments = "publish"
    });
});

Task("Icon").Does(() =>{
    CreateLogo("Save.R", "images/icon.png", new LogoSettings {
        Background = "SlateBlue",
        //FontFamily = "Monaco",
        Foreground = "White",
        Padding = 30
    });
});

var target = Argument("target", "default");
RunTarget(target);